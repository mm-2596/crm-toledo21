import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAdmin } from "../lib/auth.js";
import { renderCampaignHtml } from "../lib/email.js";
import { rentalContactWhere } from "../lib/contactScope.js";
import { madridDate } from "../lib/madrid.js";
import { BIRTHDAY_DEFAULT, FESTIVITIES, birthdayDaysLeft, nextOccurrence, personalize, templateFor, whatsappLink, whatsappNumber } from "../lib/greetings.js";

export const greetingsRouter = Router();

const emailable: Prisma.ContactWhereInput = { marketingConsent: true, unsubscribedAt: null, email: { not: null }, NOT: { email: "" } };

/**
 * Cumpleaños de hoy y de los próximos días. Los ve todo el equipo (los clientes ya son compartidos);
 * a Administración solo los de su mundo, el alquiler.
 */
greetingsRouter.get(
  "/birthdays",
  asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 0), 366);
    const today = madridDate(new Date());
    const year = Number(today.slice(0, 4));
    const template = await templateFor(BIRTHDAY_DEFAULT.key);

    const contacts = await prisma.contact.findMany({
      where: { AND: [{ birthMonth: { not: null }, birthDay: { not: null } }, req.user!.role === "ADMINISTRACION" ? rentalContactWhere() : {}] },
      select: { id: true, name: true, phone: true, email: true, birthMonth: true, birthDay: true, marketingConsent: true, unsubscribedAt: true, birthdayGreetedYear: true },
    });
    const sentIds = new Set(
      (await prisma.whatsappGreeting.findMany({ where: { occasion: `${BIRTHDAY_DEFAULT.key}-${year}` }, select: { contactId: true } })).map((g) => g.contactId),
    );

    const items = contacts
      .map((c) => ({ c, daysLeft: birthdayDaysLeft(c.birthMonth!, c.birthDay!, today) }))
      .filter((x) => x.daysLeft <= days)
      .sort((a, b) => a.daysLeft - b.daysLeft || a.c.name.localeCompare(b.c.name, "es"))
      .map(({ c, daysLeft }) => {
        const emailConsent = c.marketingConsent && !c.unsubscribedAt && Boolean(c.email);
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          month: c.birthMonth!,
          day: c.birthDay!,
          daysLeft,
          // Con consentimiento y email, el CRM le manda la felicitación solo (si la automatización está activa).
          emailConsent,
          emailSent: daysLeft === 0 && c.birthdayGreetedYear === year,
          whatsappSent: sentIds.has(c.id),
          whatsappUrl: whatsappLink(c.phone, personalize(template.whatsappText, c.name)),
        };
      });
    res.json({ autoEmail: template.enabled, birthdays: items });
  }),
);

greetingsRouter.post(
  "/whatsapp-sent",
  asyncHandler(async (req, res) => {
    const { contactId, occasion } = z.object({ contactId: z.string(), occasion: z.string().regex(/^[A-Z_]+-\d{4}$/) }).parse(req.body);
    const exists = await prisma.whatsappGreeting.findFirst({ where: { contactId, occasion }, select: { id: true } });
    if (!exists) await prisma.whatsappGreeting.create({ data: { contactId, occasion, userId: req.user!.userId } });
    res.status(204).send();
  }),
);

// --- A partir de aquí, solo administradores: festividades, mensajes y listas de envío ---

greetingsRouter.get(
  "/festivities",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const today = madridDate(new Date());
    const [emailAudience, whatsappAudience] = await Promise.all([
      prisma.contact.count({ where: emailable }),
      prisma.contact.count({ where: { whatsappConsent: true, unsubscribedAt: null, phone: { not: null }, NOT: { phone: "" } } }),
    ]);
    const festivities = await Promise.all(
      FESTIVITIES.map(async (f) => {
        const next = nextOccurrence(f, today);
        const occasion = `${f.key}-${next.year}`;
        return {
          key: f.key,
          name: f.name,
          theme: f.theme,
          date: next.date.toISOString().slice(0, 10),
          daysLeft: next.daysLeft,
          occasion,
          template: await templateFor(f.key),
          whatsappSent: await prisma.whatsappGreeting.count({ where: { occasion } }),
        };
      }),
    );
    festivities.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json({ festivities, birthday: { key: BIRTHDAY_DEFAULT.key, template: await templateFor(BIRTHDAY_DEFAULT.key) }, audience: { email: emailAudience, whatsapp: whatsappAudience } });
  }),
);

greetingsRouter.put(
  "/templates/:key",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const key = String(req.params.key);
    if (key !== BIRTHDAY_DEFAULT.key && !FESTIVITIES.some((f) => f.key === key)) return res.status(404).json({ error: "Festividad no encontrada" });
    const data = z
      .object({
        subject: z.string().trim().max(150).optional().nullable(),
        body: z.string().trim().max(5000).optional().nullable(),
        whatsappText: z.string().trim().max(1000).optional().nullable(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);
    // Un texto vacío vuelve al de por defecto.
    const clean = { subject: data.subject || null, body: data.body || null, whatsappText: data.whatsappText || null };
    const saved = await prisma.greetingTemplate.upsert({
      where: { key },
      create: { key, ...clean, enabled: data.enabled ?? true },
      update: { ...clean, ...(data.enabled === undefined ? {} : { enabled: data.enabled }) },
    });
    res.json({ ...saved, template: await templateFor(key) });
  }),
);

greetingsRouter.post(
  "/festivities/:key/campaign",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const def = FESTIVITIES.find((f) => f.key === String(req.params.key));
    if (!def) return res.status(404).json({ error: "Festividad no encontrada" });
    const next = nextOccurrence(def, madridDate(new Date()));
    const template = await templateFor(def.key);
    const campaign = await prisma.campaign.create({
      data: { name: `${def.name} ${next.year}`, subject: template.subject, body: template.body, theme: def.theme, segment: {} },
    });
    res.status(201).json(campaign);
  }),
);

/** Lista para felicitar por WhatsApp con un clic: solo quien ha dado su consentimiento para WhatsApp. */
greetingsRouter.get(
  "/festivities/:key/whatsapp",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const def = FESTIVITIES.find((f) => f.key === String(req.params.key));
    if (!def) return res.status(404).json({ error: "Festividad no encontrada" });
    const next = nextOccurrence(def, madridDate(new Date()));
    const occasion = `${def.key}-${next.year}`;
    const template = await templateFor(def.key);
    const [contacts, sent] = await Promise.all([
      prisma.contact.findMany({
        where: { whatsappConsent: true, unsubscribedAt: null, phone: { not: null }, NOT: { phone: "" } },
        select: { id: true, name: true, phone: true },
        orderBy: { name: "asc" },
      }),
      prisma.whatsappGreeting.findMany({ where: { occasion }, select: { contactId: true } }),
    ]);
    const done = new Set(sent.map((s) => s.contactId));
    res.json({
      occasion,
      recipients: contacts
        .filter((c) => whatsappNumber(c.phone))
        .map((c) => ({ id: c.id, name: c.name, phone: c.phone, sent: done.has(c.id), url: whatsappLink(c.phone, `${personalize(template.whatsappText, c.name)}\n\nSi no quieres recibir más mensajes, respóndenos BAJA.`) })),
      invalidPhones: contacts.filter((c) => !whatsappNumber(c.phone)).length,
    });
  }),
);

/** Cómo se ve el correo de una festividad (o del cumpleaños) para quien lo recibe, con un nombre de ejemplo. */
greetingsRouter.get(
  "/preview/:key",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const key = String(req.params.key);
    const def = key === BIRTHDAY_DEFAULT.key ? BIRTHDAY_DEFAULT : FESTIVITIES.find((f) => f.key === key);
    if (!def) return res.status(404).json({ error: "Festividad no encontrada" });
    const template = await templateFor(key);
    res.json({ html: renderCampaignHtml({ subject: template.subject, body: template.body, theme: def.theme }, "Ana García", "#") });
  }),
);
