import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { signToken } from "../lib/auth.js";
import { sendLeadConfirmationEmail } from "../lib/email.js";

export const publicRouter = Router();

/**
 * Endpoints públicos para la web de Toledo21 (Next.js, en website/): listado
 * y ficha de propiedades para mostrar al público, un formulario de contacto
 * que crea el lead directamente en el CRM, y login de agentes (la web no
 * guarda contraseñas, se las pregunta a este mismo servidor).
 */

function publicBaseUrl(protocol: string, host: string): string {
  return process.env.PUBLIC_BASE_URL || `${protocol}://${host}`;
}

const publicPropertySelect = {
  id: true,
  reference: true,
  title: true,
  type: true,
  listingType: true,
  status: true,
  condition: true,
  price: true,
  hoaFees: true,
  city: true,
  zone: true,
  address: true,
  latitude: true,
  longitude: true,
  bedrooms: true,
  bathrooms: true,
  areaM2: true,
  usableAreaM2: true,
  floor: true,
  hasElevator: true,
  yearBuilt: true,
  parkingSpaces: true,
  heating: true,
  hasAirConditioning: true,
  hasTerrace: true,
  hasBalcony: true,
  hasGarden: true,
  hasPool: true,
  hasStorageRoom: true,
  isFurnished: true,
  isExterior: true,
  energyRating: true,
  energyConsumptionValue: true,
  energyEmissionsRating: true,
  energyEmissionsValue: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  images: { select: { id: true, url: true, order: true } },
  agent: { select: { id: true, name: true, email: true, phone: true } },
} as const;

publicRouter.get(
  "/properties",
  asyncHandler(async (req, res) => {
    const { type, listingType, city, bedroomsMin, priceMin, priceMax, q, page, pageSize } = req.query;
    const take = Math.min(Number(pageSize) || 12, 48);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = {
      status: { not: "RETIRADO" as const },
      type: type ? (String(type) as never) : undefined,
      listingType: listingType ? (String(listingType) as never) : undefined,
      city: city ? { equals: String(city) } : undefined,
      bedrooms: bedroomsMin ? { gte: Number(bedroomsMin) } : undefined,
      price: priceMin || priceMax ? { gte: priceMin ? Number(priceMin) : undefined, lte: priceMax ? Number(priceMax) : undefined } : undefined,
      OR: q
        ? [
            { title: { contains: String(q) } },
            { city: { contains: String(q) } },
            { zone: { contains: String(q) } },
          ]
        : undefined,
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        select: publicPropertySelect,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.property.count({ where }),
    ]);

    const baseUrl = publicBaseUrl(req.protocol, req.get("host") || "");
    const withAbsoluteImages = properties.map((p) => ({
      ...p,
      images: p.images.map((img) => ({ ...img, url: `${baseUrl}${img.url}` })),
    }));

    res.json({ total, page: Number(page) || 1, pageSize: take, properties: withAbsoluteImages });
  }),
);

publicRouter.get(
  "/properties/:id",
  asyncHandler(async (req, res) => {
    const property = await prisma.property.findFirst({
      where: { id: String(req.params.id), status: { not: "RETIRADO" } },
      select: publicPropertySelect,
    });
    if (!property) return res.status(404).json({ error: "Propiedad no encontrada" });

    const baseUrl = publicBaseUrl(req.protocol, req.get("host") || "");
    const images = property.images.map((img) => ({ ...img, url: `${baseUrl}${img.url}` }));

    const similar = await prisma.property.findMany({
      where: {
        id: { not: property.id },
        status: { not: "RETIRADO" },
        type: property.type,
        city: property.city ?? undefined,
      },
      select: publicPropertySelect,
      take: 4,
    });

    res.json({
      ...property,
      images,
      similar: similar.map((p) => ({ ...p, images: p.images.map((img) => ({ ...img, url: `${baseUrl}${img.url}` })) })),
    });
  }),
);

const leadInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
});

publicRouter.post(
  "/leads",
  asyncHandler(async (req, res) => {
    const data = leadInput.parse(req.body);

    const property = data.propertyId
      ? await prisma.property.findUnique({ where: { id: data.propertyId } })
      : null;

    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        source: "WEB_HOUZEZ",
        propertyType: property?.type,
        listingType: property?.listingType,
        preferredZone: property?.zone,
        notes: [
          property ? `Interesado/a en: ${property.title} (${property.reference})` : null,
          data.message ? `Mensaje: ${data.message}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });

    if (property) {
      const firstStage = await prisma.pipelineStage.findFirst({ orderBy: { order: "asc" } });
      if (firstStage) {
        await prisma.deal.create({
          data: {
            contactId: contact.id,
            propertyId: property.id,
            stageId: firstStage.id,
            agentId: property.agentId,
            value: property.price,
          },
        });
      }
    }

    if (data.email) {
      // No bloquea la respuesta: si el correo falla, el lead ya está
      // guardado en el CRM de todas formas.
      sendLeadConfirmationEmail(data.email, data.name).catch(() => {});
    }

    res.status(201).json({ ok: true });
  }),
);

const agentLoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

publicRouter.post(
  "/agent-login",
  asyncHandler(async (req, res) => {
    const data = agentLoginInput.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.active) return res.status(401).json({ error: "Email o contraseña incorrectos" });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Email o contraseña incorrectos" });

    const token = signToken({ userId: user.id, role: user.role });
    res.json({ token, agent: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }),
);
