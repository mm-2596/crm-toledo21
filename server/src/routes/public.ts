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

const publicAgentSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  photoUrl: true,
  jobTitle: true,
  bio: true,
  createdAt: true,
} as const;

function withAbsolutePhoto<T extends { photoUrl: string | null }>(agent: T, baseUrl: string): T {
  return { ...agent, photoUrl: agent.photoUrl ? `${baseUrl}${agent.photoUrl}` : null };
}

publicRouter.get(
  "/agents",
  asyncHandler(async (req, res) => {
    const baseUrl = publicBaseUrl(req.protocol, req.get("host") || "");
    const agents = await prisma.user.findMany({
      where: { active: true },
      select: {
        ...publicAgentSelect,
        _count: { select: { properties: { where: { status: { not: "RETIRADO" } } } } },
        reviews: { where: { approved: true }, select: { rating: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(
      agents.map(({ _count, reviews, ...agent }) => ({
        ...withAbsolutePhoto(agent, baseUrl),
        propertiesCount: _count.properties,
        reviewsCount: reviews.length,
        averageRating: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null,
      })),
    );
  }),
);

publicRouter.get(
  "/agents/:id",
  asyncHandler(async (req, res) => {
    const baseUrl = publicBaseUrl(req.protocol, req.get("host") || "");
    const agent = await prisma.user.findFirst({
      where: { id: String(req.params.id), active: true },
      select: publicAgentSelect,
    });
    if (!agent) return res.status(404).json({ error: "Agente no encontrado" });

    const [properties, reviews] = await Promise.all([
      prisma.property.findMany({
        where: { agentId: agent.id, status: { not: "RETIRADO" } },
        select: publicPropertySelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.agentReview.findMany({
        where: { agentId: agent.id, approved: true },
        select: { id: true, authorName: true, rating: true, comment: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      ...withAbsolutePhoto(agent, baseUrl),
      properties: properties.map((p) => ({ ...p, images: p.images.map((img) => ({ ...img, url: `${baseUrl}${img.url}` })) })),
      reviews,
      averageRating: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null,
    });
  }),
);

const agentReviewInput = z.object({
  authorName: z.string().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

publicRouter.post(
  "/agents/:id/reviews",
  asyncHandler(async (req, res) => {
    const agent = await prisma.user.findFirst({ where: { id: String(req.params.id), active: true } });
    if (!agent) return res.status(404).json({ error: "Agente no encontrado" });

    const data = agentReviewInput.parse(req.body);
    await prisma.agentReview.create({
      data: { agentId: agent.id, ...data, approved: false },
    });
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
