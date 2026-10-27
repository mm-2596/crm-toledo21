import { geocodePropertyLater } from "../lib/geocode.js";
import { getStoredNearby, isStale, refreshNearbyLater } from "../lib/nearby.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { signToken } from "../lib/auth.js";
import { sendLeadConfirmationEmail, sendNewLeadAlertEmail, sendValuationEmail } from "../lib/email.js";
import { estimateValuation, type ZoneRow } from "../lib/valuation.js";

export const publicRouter = Router();

/**
 * Endpoints públicos para la web de Toledo21 (Next.js, en website/): listado
 * y ficha de propiedades para mostrar al público, un formulario de contacto
 * que crea el lead directamente en el CRM, y login de agentes (la web no
 * guarda contraseñas, se las pregunta a este mismo servidor).
 */

function publicBaseUrl(protocol: string, host: string): string {
  const base = process.env.PUBLIC_BASE_URL || `${protocol}://${host}`;
  // Sin esto, una PUBLIC_BASE_URL con barra final produce URLs de imagen con
  // doble barra ("https://dominio.com//uploads/...") que el optimizador de
  // imagenes de Next/Vercel rechaza con un 400, aunque la URL en si cargue bien.
  return base.replace(/\/+$/, "");
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
  videos: { select: { id: true, url: true, order: true } },
  agent: { select: { id: true, name: true, email: true, phone: true } },
} as const;

function withAbsoluteMedia<T extends { images: { url: string }[]; videos: { url: string }[] }>(
  property: T,
  baseUrl: string,
): T {
  return {
    ...property,
    images: property.images.map((img) => ({ ...img, url: `${baseUrl}${img.url}` })),
    videos: property.videos.map((vid) => ({ ...vid, url: `${baseUrl}${vid.url}` })),
  };
}

// Cada consulta de propiedades encadena varias idas y vueltas a la base de datos
// (propiedades, fotos, vídeos, agente y recuento) y tardaba ~2 s. Con 30 s de
// memoria, casi todas las visitas responden al instante; los cambios hechos en
// el CRM se ven en menos de medio minuto.
const LIST_CACHE_TTL_MS = 30_000;
const LIST_CACHE_MAX_ENTRIES = 100;
const listCache = new Map<string, { at: number; body: unknown }>();

publicRouter.get(
  "/properties",
  asyncHandler(async (req, res) => {
    const cacheKey = `${req.get("host")}${req.originalUrl}`;
    const cached = listCache.get(cacheKey);
    if (cached && Date.now() - cached.at < LIST_CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=120");
      return res.json(cached.body);
    }
    const { type, listingType, city, bedroomsMin, bathroomsMin, priceMin, priceMax, areaMin, areaMax, q, page, pageSize, sort } = req.query;
    const wants = (key: string) => req.query[key] === "1";
    const take = Math.min(Number(pageSize) || 12, 48);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = {
      status: { not: "RETIRADO" as const },
      type: type ? (String(type) as never) : undefined,
      listingType: listingType ? (String(listingType) as never) : undefined,
      city: city ? { equals: String(city) } : undefined,
      bedrooms: bedroomsMin ? { gte: Number(bedroomsMin) } : undefined,
      bathrooms: bathroomsMin ? { gte: Number(bathroomsMin) } : undefined,
      areaM2: areaMin || areaMax ? { gte: areaMin ? Number(areaMin) : undefined, lte: areaMax ? Number(areaMax) : undefined } : undefined,
      hasElevator: wants("elevator") ? true : undefined,
      hasPool: wants("pool") ? true : undefined,
      hasTerrace: wants("terrace") ? true : undefined,
      hasGarden: wants("garden") ? true : undefined,
      hasStorageRoom: wants("storage") ? true : undefined,
      parkingSpaces: wants("parking") ? { gte: 1 } : undefined,
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
        orderBy: sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.property.count({ where }),
    ]);

    // Las propiedades que aún no tienen coordenadas se colocan en el mapa en segundo plano.
    properties.filter((p) => p.latitude == null || p.longitude == null).slice(0, 3).forEach((p) => geocodePropertyLater(p.id));

    const baseUrl = publicBaseUrl(req.protocol, req.get("host") || "");
    const propertiesWithMedia = properties.map((p) => withAbsoluteMedia(p, baseUrl));

    const body = { total, page: Number(page) || 1, pageSize: take, properties: propertiesWithMedia };
    if (listCache.size >= LIST_CACHE_MAX_ENTRIES) listCache.delete(listCache.keys().next().value as string);
    listCache.set(cacheKey, { at: Date.now(), body });
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=120");
    res.json(body);
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

    // Transporte y servicios cercanos: lo guardado; si falta o es antiguo, se calcula en segundo plano.
    const stored = await getStoredNearby(property.id);
    if (isStale(stored) && property.latitude != null && property.longitude != null) refreshNearbyLater(property.id);

    res.json({
      ...withAbsoluteMedia(property, baseUrl),
      nearby: stored?.places ?? [],
      similar: similar.map((p) => withAbsoluteMedia(p, baseUrl)),
    });
  }),
);

const leadInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  marketingConsent: z.boolean().optional(),
});

const newsletterInput = z.object({
  email: z.string().email(),
  consent: z.literal(true),
});

publicRouter.post(
  "/newsletter",
  asyncHandler(async (req, res) => {
    const data = newsletterInput.parse(req.body);
    const email = data.email.trim().toLowerCase();
    const existing = await prisma.contact.findFirst({ where: { email } });

    if (existing) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { marketingConsent: true, marketingConsentAt: new Date(), unsubscribedAt: null },
      });
    } else {
      await prisma.contact.create({
        data: {
          name: email.split("@")[0],
          email,
          source: "OTHER",
          marketingConsent: true,
          marketingConsentAt: new Date(),
          notes: "Suscrito a la newsletter desde la web.",
        },
      });
    }

    res.status(201).json({ ok: true });
  }),
);

type LeadData = z.infer<typeof leadInput>;

/** Crea el contacto (y la operación si es por una propiedad), la tarea de 24 h y avisa al equipo. */
async function registerLead(data: LeadData, opts: { sendConfirmation?: boolean; taskNote?: string } = {}) {
  const property = data.propertyId ? await prisma.property.findUnique({ where: { id: data.propertyId } }) : null;

  const contact = await prisma.contact.create({
    data: {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      source: "WEB_HOUZEZ",
      marketingConsent: data.marketingConsent === true,
      marketingConsentAt: data.marketingConsent === true ? new Date() : null,
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

  const isValuation = Boolean(data.message?.startsWith("TASACIÓN GRATUITA"));
  if (isValuation) {
    // Tarea con vencimiento a 24 h (la promesa hecha en la web): aparece en
    // "Tareas" y en el resumen del asistente hasta que alguien la complete.
    await prisma.activity.create({
      data: {
        type: "TAREA",
        description: `Llamar para dar la tasación gratuita solicitada en la web${opts.taskNote ? ` (${opts.taskNote})` : ""}`,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        contactId: contact.id,
      },
    });
  }

  const crmBase = (process.env.CLIENT_ORIGIN || "").replace(/\/+$/, "");
  sendNewLeadAlertEmail({
    isValuation,
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    contactUrl: `${crmBase}/contactos/${contact.id}`,
  }).catch(() => {});

  if (data.email && opts.sendConfirmation !== false) {
    // No bloquea la respuesta: si el correo falla, el lead ya está
    // guardado en el CRM de todas formas.
    sendLeadConfirmationEmail(data.email, data.name).catch(() => {});
  }

  return contact;
}

publicRouter.post(
  "/leads",
  asyncHandler(async (req, res) => {
    await registerLead(leadInput.parse(req.body));
    res.status(201).json({ ok: true });
  }),
);

/** Zonas con precio, para el desplegable de la tasación (sin precios). */
publicRouter.get(
  "/zones",
  asyncHandler(async (_req, res) => {
    try {
      const rows = await prisma.zonePrice.findMany({ where: { active: true, saleEurM2: { gt: 0 } }, orderBy: [{ city: "asc" }, { zone: "asc" }], select: { id: true, city: true, zone: true } });
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
      res.json({ zones: rows });
    } catch {
      res.json({ zones: [] });
    }
  }),
);

const valuationRequestInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  type: z.enum(["Piso", "Casa o chalet", "Local u oficina", "Terreno u otro"]),
  address: z.string().trim().min(3).max(200),
  zoneId: z.string().optional().nullable(),
  areaM2: z.number().positive().max(100000).optional().nullable(),
  bedrooms: z.number().int().min(0).max(30).optional().nullable(),
  bathrooms: z.number().int().min(0).max(30).optional().nullable(),
  condition: z.enum(["Nuevo", "Buen estado", "Reformado", "A reformar"]).optional().nullable(),
  extras: z.array(z.string().max(40)).max(10).default([]),
  timing: z.string().max(80).optional().nullable(),
  marketingConsent: z.boolean().optional(),
});

/**
 * Solicitud de tasación desde la web: se guarda como siempre (contacto + tarea de 24 h) y, si hay
 * precios de la zona, se calcula un rango orientativo que se envía por correo y se devuelve a la web.
 */
publicRouter.post(
  "/valuation-requests",
  asyncHandler(async (req, res) => {
    const d = valuationRequestInput.parse(req.body);
    if (!d.email && !d.phone) return res.status(400).json({ error: "Hace falta un teléfono o un email" });

    let rows: ZoneRow[] = [];
    try {
      rows = await prisma.zonePrice.findMany({ where: { active: true } });
    } catch {
      rows = [];
    }
    const estimate = d.areaM2
      ? estimateValuation(rows, { type: d.type, address: d.address, zoneId: d.zoneId, areaM2: d.areaM2, condition: d.condition, extras: d.extras })
      : null;

    const lines = [
      "TASACIÓN GRATUITA SOLICITADA DESDE LA WEB",
      `Tipo: ${d.type}`,
      `Ubicación: ${d.address}`,
      d.areaM2 ? `Superficie: ${d.areaM2} m²` : null,
      d.bedrooms != null ? `Habitaciones: ${d.bedrooms}` : null,
      d.bathrooms != null ? `Baños: ${d.bathrooms}` : null,
      d.condition ? `Estado: ${d.condition}` : null,
      d.extras.length ? `Extras: ${d.extras.join(", ")}` : null,
      d.timing ? `Plazo para vender: ${d.timing}` : null,
      estimate ? `VALORACIÓN ORIENTATIVA ENVIADA: ${estimate.low.toLocaleString("es-ES")} – ${estimate.high.toLocaleString("es-ES")} € (${estimate.eurM2} €/m² en ${estimate.zoneLabel})` : "Sin valoración automática (falta precio de la zona o el tipo no se estima): la prepara un agente.",
    ].filter(Boolean);

    const contact = await registerLead(
      { name: d.name, email: d.email ?? null, phone: d.phone ?? null, message: lines.join("\n"), marketingConsent: d.marketingConsent },
      {
        sendConfirmation: !estimate,
        taskNote: estimate ? `valoración orientativa enviada: ${estimate.low.toLocaleString("es-ES")}–${estimate.high.toLocaleString("es-ES")} €` : "sin valoración automática",
      },
    );

    if (estimate) {
      await prisma.valuation
        .create({
          data: {
            source: "web",
            estimatedValue: estimate.mid,
            inputData: { contactId: contact.id, ...d },
            factors: { low: estimate.low, high: estimate.high, eurM2: estimate.eurM2, zone: estimate.zoneLabel, ...estimate.factors },
          },
        })
        .catch(() => {});
      if (d.email) {
        sendValuationEmail({
          to: d.email,
          name: d.name,
          low: estimate.low,
          high: estimate.high,
          zoneLabel: estimate.zoneLabel,
          areaM2: d.areaM2!,
          typeLabel: d.type,
          condition: d.condition,
          extras: d.extras,
        }).catch(() => {});
      }
    }

    res.status(201).json({ ok: true, estimate: estimate ? { low: estimate.low, high: estimate.high, zone: estimate.zoneLabel, emailed: Boolean(d.email) } : null });
  }),
);

function unsubscribePage(title: string, text: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f1ede4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:460px;margin:12vh auto;padding:32px;background:#faf8f4;border:1px solid #e4ddd0;border-radius:16px;">
<h1 style="margin:0 0 12px;font-size:20px;color:#14110f;">${title}</h1><p style="margin:0;font-size:15px;line-height:1.6;color:#4a443d;">${text}</p></div></body></html>`;
}

async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!token || token === "prueba") return token === "prueba";
  const result = await prisma.contact.updateMany({
    where: { unsubscribeToken: token },
    data: { marketingConsent: false, unsubscribedAt: new Date() },
  });
  return result.count > 0;
}

// Baja con un clic desde el enlace del email (GET) o desde el botón nativo del cliente de correo (POST).
publicRouter.get(
  "/unsubscribe",
  asyncHandler(async (req, res) => {
    const ok = await unsubscribeByToken(String(req.query.token || ""));
    res
      .status(ok ? 200 : 404)
      .type("html")
      .send(
        ok
          ? unsubscribePage("Te has dado de baja", "Ya no recibirás más comunicaciones comerciales de Toledo21. Lamentamos verte marchar.")
          : unsubscribePage("Enlace no válido", "No hemos encontrado esta suscripción. Puede que ya te hayas dado de baja."),
      );
  }),
);

publicRouter.post(
  "/unsubscribe",
  asyncHandler(async (req, res) => {
    const ok = await unsubscribeByToken(String(req.query.token || ""));
    res.status(ok ? 200 : 404).json({ ok });
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
      properties: properties.map((p) => withAbsoluteMedia(p, baseUrl)),
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
