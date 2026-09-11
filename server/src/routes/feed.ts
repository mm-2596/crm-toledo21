import { Router } from "express";
import type { Request } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const feedRouter = Router();

/**
 * Feed genérico de propiedades para sindicación externa (web propia vía el
 * plugin "Houzez Property Feed", y en el futuro Idealista/Fotocasa una vez
 * tengamos su formato exacto). Un único origen de datos, dos salidas
 * (JSON y XML) para no depender de lo que acepte cada destino.
 *
 * Protegido con un token simple por query string (?token=...), pensado para
 * que un importador externo (no una persona logueada en el CRM) pueda leerlo.
 */
function checkFeedToken(req: Request): boolean {
  const expected = process.env.FEED_ACCESS_TOKEN;
  if (!expected) return true; // sin token configurado, no se exige (solo para desarrollo)
  return req.query.token === expected;
}

function publicBaseUrl(req: Request): string {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
}

async function buildFeedItems(baseUrl: string) {
  const properties = await prisma.property.findMany({
    where: { status: { not: "RETIRADO" } },
    include: { images: { orderBy: { order: "asc" } }, agent: true },
    orderBy: { updatedAt: "desc" },
  });

  return properties.map((p) => ({
    reference: p.reference,
    title: p.title,
    description: p.description ?? "",
    type: p.type,
    operation: p.listingType,
    status: p.status,
    price: p.price,
    currency: "EUR",
    city: p.city ?? "",
    zone: p.zone ?? "",
    address: p.address ?? "",
    latitude: p.latitude,
    longitude: p.longitude,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    areaM2: p.areaM2,
    floor: p.floor,
    hasElevator: p.hasElevator,
    energyRating: p.energyRating ?? "",
    images: p.images.map((img) => `${baseUrl}${img.url}`),
    agentName: p.agent?.name ?? "",
    agentPhone: p.agent?.phone ?? "",
    agentEmail: p.agent?.email ?? "",
    updatedAt: p.updatedAt.toISOString(),
  }));
}

feedRouter.get(
  "/properties.json",
  asyncHandler(async (req, res) => {
    if (!checkFeedToken(req)) return res.status(403).json({ error: "Token de feed inválido" });
    const items = await buildFeedItems(publicBaseUrl(req));
    res.json({ generatedAt: new Date().toISOString(), count: items.length, properties: items });
  }),
);

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

feedRouter.get(
  "/properties.xml",
  asyncHandler(async (req, res) => {
    if (!checkFeedToken(req)) return res.status(403).send("Token de feed inválido");
    const items = await buildFeedItems(publicBaseUrl(req));

    const xmlItems = items
      .map(
        (p) => `  <property>
    <reference>${escapeXml(p.reference)}</reference>
    <title>${escapeXml(p.title)}</title>
    <description>${escapeXml(p.description)}</description>
    <type>${escapeXml(p.type)}</type>
    <operation>${escapeXml(p.operation)}</operation>
    <status>${escapeXml(p.status)}</status>
    <price>${p.price}</price>
    <currency>${p.currency}</currency>
    <city>${escapeXml(p.city)}</city>
    <zone>${escapeXml(p.zone)}</zone>
    <address>${escapeXml(p.address)}</address>
    <latitude>${p.latitude ?? ""}</latitude>
    <longitude>${p.longitude ?? ""}</longitude>
    <bedrooms>${p.bedrooms ?? ""}</bedrooms>
    <bathrooms>${p.bathrooms ?? ""}</bathrooms>
    <area_m2>${p.areaM2 ?? ""}</area_m2>
    <floor>${p.floor ?? ""}</floor>
    <has_elevator>${p.hasElevator ?? ""}</has_elevator>
    <energy_rating>${escapeXml(p.energyRating)}</energy_rating>
    <images>
${p.images.map((url) => `      <image>${escapeXml(url)}</image>`).join("\n")}
    </images>
    <agent_name>${escapeXml(p.agentName)}</agent_name>
    <agent_phone>${escapeXml(p.agentPhone)}</agent_phone>
    <agent_email>${escapeXml(p.agentEmail)}</agent_email>
    <updated_at>${p.updatedAt}</updated_at>
  </property>`,
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed generated_at="${new Date().toISOString()}" count="${items.length}">
${xmlItems}
</feed>`;

    res.type("application/xml").send(xml);
  }),
);
