import { Router } from "express";
import type { Request } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { isSafeHttpUrl, sendCampaignBatch } from "../lib/email.js";

export const campaignsRouter = Router();

const BATCH_SIZE = 50;
// Resend limita las peticiones por segundo; un respiro entre lotes evita errores 429.
const BATCH_DELAY_MS = 700;

const segmentSchema = z
  .object({
    sources: z.array(z.enum(["WEB_HOUZEZ", "MANUAL", "WHATSAPP", "EMAIL", "PHONE", "REFERRAL", "OTHER"])).optional(),
    listingType: z.enum(["VENTA", "ALQUILER"]).optional(),
    propertyType: z
      .enum(["PISO", "CASA", "CHALET", "ATICO", "DUPLEX", "ESTUDIO", "LOCAL", "OFICINA", "GARAJE", "TERRENO", "NAVE_INDUSTRIAL", "TRASTERO", "OTRO"])
      .optional(),
    priority: z.enum(["ALTA", "MEDIA", "BAJA"]).optional(),
    zone: z.string().trim().max(80).optional(),
    onlyValuations: z.boolean().optional(),
  })
  .default({});

type Segment = z.infer<typeof segmentSchema>;

const campaignInput = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(10000),
  ctaLabel: z.string().trim().max(60).optional().nullable(),
  ctaUrl: z.string().trim().max(500).optional().nullable(),
  segment: segmentSchema,
});

function validateCta(data: { ctaLabel?: string | null; ctaUrl?: string | null }) {
  if (data.ctaUrl && !isSafeHttpUrl(data.ctaUrl)) return "El enlace del botón debe empezar por http:// o https://";
  if (data.ctaUrl && !data.ctaLabel) return "Pon el texto del botón o quita el enlace";
  return null;
}

/** Nunca se escribe a quien no haya dado su consentimiento o se haya dado de baja. */
function audienceWhere(segment: Segment): Prisma.ContactWhereInput {
  const and: Prisma.ContactWhereInput[] = [
    { marketingConsent: true },
    { unsubscribedAt: null },
    { email: { not: null } },
    { NOT: { email: "" } },
  ];
  if (segment.sources?.length) and.push({ source: { in: segment.sources } });
  if (segment.listingType) and.push({ listingType: segment.listingType });
  if (segment.propertyType) and.push({ propertyType: segment.propertyType });
  if (segment.priority) and.push({ priority: segment.priority });
  if (segment.zone) and.push({ preferredZone: { contains: segment.zone, mode: "insensitive" } });
  if (segment.onlyValuations) and.push({ notes: { contains: "TASACIÓN GRATUITA" } });
  return { AND: and };
}

function apiBaseUrl(req: Request): string {
  return (process.env.PUBLIC_BASE_URL || `https://${req.get("host")}`).replace(/\/+$/, "");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

campaignsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
    res.json(campaigns);
  }),
);

campaignsRouter.post(
  "/audience",
  asyncHandler(async (req, res) => {
    const segment = segmentSchema.parse(req.body?.segment);
    const [count, withoutConsent, unsubscribed] = await Promise.all([
      prisma.contact.count({ where: audienceWhere(segment) }),
      prisma.contact.count({ where: { email: { not: null }, NOT: { email: "" }, marketingConsent: false } }),
      prisma.contact.count({ where: { unsubscribedAt: { not: null } } }),
    ]);
    res.json({ count, withoutConsent, unsubscribed });
  }),
);

campaignsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: String(req.params.id) },
      include: { sends: { where: { status: "ERROR" }, take: 20, orderBy: { createdAt: "desc" } } },
    });
    if (!campaign) return res.status(404).json({ error: "Campaña no encontrada" });
    res.json(campaign);
  }),
);

campaignsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = campaignInput.parse(req.body);
    const ctaError = validateCta(data);
    if (ctaError) return res.status(400).json({ error: ctaError });
    const campaign = await prisma.campaign.create({ data: { ...data, ctaLabel: data.ctaLabel || null, ctaUrl: data.ctaUrl || null } });
    res.status(201).json(campaign);
  }),
);

campaignsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Campaña no encontrada" });
    if (existing.status !== "BORRADOR") return res.status(409).json({ error: "Solo se pueden editar campañas en borrador" });
    const data = campaignInput.parse(req.body);
    const ctaError = validateCta(data);
    if (ctaError) return res.status(400).json({ error: ctaError });
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { ...data, ctaLabel: data.ctaLabel || null, ctaUrl: data.ctaUrl || null },
    });
    res.json(campaign);
  }),
);

campaignsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Campaña no encontrada" });
    if (existing.status === "ENVIANDO") return res.status(409).json({ error: "La campaña se está enviando ahora mismo" });
    await prisma.campaign.delete({ where: { id } });
    res.status(204).send();
  }),
);

campaignsRouter.post(
  "/:id/test",
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const campaign = await prisma.campaign.findUnique({ where: { id: String(req.params.id) } });
    if (!campaign) return res.status(404).json({ error: "Campaña no encontrada" });

    const result = await sendCampaignBatch(campaign, [
      { to: email, name: "Nombre", unsubscribeUrl: `${apiBaseUrl(req)}/api/public/unsubscribe?token=prueba` },
    ]);
    if (!result.ok) return res.status(502).json({ error: `No se pudo enviar la prueba: ${result.error}` });
    res.json({ ok: true });
  }),
);

campaignsRouter.post(
  "/:id/send",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: "Campaña no encontrada" });
    if (campaign.status !== "BORRADOR") return res.status(409).json({ error: "Esta campaña ya se envió" });
    if (!process.env.RESEND_API_KEY) return res.status(400).json({ error: "El envío de correos no está configurado (falta RESEND_API_KEY)" });

    const segment = segmentSchema.parse(campaign.segment ?? {});
    const contacts = await prisma.contact.findMany({
      where: audienceWhere(segment),
      select: { id: true, name: true, email: true, unsubscribeToken: true },
    });
    if (contacts.length === 0) return res.status(400).json({ error: "No hay contactos con consentimiento que encajen con esta audiencia" });

    // Reclama la campaña antes de responder para que un doble clic no la envíe dos veces.
    const claimed = await prisma.campaign.updateMany({
      where: { id, status: "BORRADOR" },
      data: { status: "ENVIANDO", recipientCount: contacts.length, sentCount: 0, failedCount: 0 },
    });
    if (claimed.count === 0) return res.status(409).json({ error: "Esta campaña ya se está enviando" });

    const baseUrl = apiBaseUrl(req);
    res.status(202).json({ ok: true, recipients: contacts.length });

    // El envío sigue en segundo plano; la pantalla del CRM consulta el progreso.
    void (async () => {
      let sent = 0;
      let failed = 0;
      try {
        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
          const batch = contacts.slice(i, i + BATCH_SIZE);
          const withTokens = await Promise.all(
            batch.map(async (c) => {
              if (c.unsubscribeToken) return { ...c, token: c.unsubscribeToken };
              const token = randomBytes(24).toString("hex");
              await prisma.contact.update({ where: { id: c.id }, data: { unsubscribeToken: token } });
              return { ...c, token };
            }),
          );

          const result = await sendCampaignBatch(
            campaign,
            withTokens.map((c) => ({
              to: c.email as string,
              name: c.name,
              unsubscribeUrl: `${baseUrl}/api/public/unsubscribe?token=${c.token}`,
            })),
          );

          await prisma.campaignSend.createMany({
            data: withTokens.map((c) => ({
              campaignId: id,
              contactId: c.id,
              email: c.email as string,
              status: result.ok ? "ENVIADO" : "ERROR",
              error: result.ok ? null : result.error,
            })),
          });
          if (result.ok) sent += batch.length;
          else failed += batch.length;
          await prisma.campaign.update({ where: { id }, data: { sentCount: sent, failedCount: failed } });

          if (i + BATCH_SIZE < contacts.length) await sleep(BATCH_DELAY_MS);
        }
      } catch (err) {
        console.error("Error enviando la campaña", id, err);
      } finally {
        await prisma.campaign
          .update({ where: { id }, data: { status: "ENVIADA", sentAt: new Date(), sentCount: sent, failedCount: contacts.length - sent } })
          .catch((err) => console.error("No se pudo cerrar la campaña", id, err));
      }
    })();
  }),
);
