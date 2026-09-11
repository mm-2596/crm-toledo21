import { Router } from "express";
import type { Request } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const feedRouter = Router();

/**
 * Feed genérico de propiedades para sindicación externa (web propia vía el
 * plugin "Houzez Property Feed", y en el futuro Idealista/Fotocasa una vez
 * tengamos su formato exacto). Un único origen de datos, dos salidas
 * (JSON y XML) para no depender de lo que acepte cada destino. Incluye ya
 * los campos que suelen pedir los portales españoles (certificado
 * energético con letra + valor de consumo y emisiones, estado, año de
 * construcción, calefacción, superficie útil vs construida, etc.).
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
    condition: p.condition ?? "",
    price: p.price,
    currency: "EUR",
    hoaFees: p.hoaFees,
    city: p.city ?? "",
    zone: p.zone ?? "",
    address: p.address ?? "",
    latitude: p.latitude,
    longitude: p.longitude,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    areaM2: p.areaM2,
    usableAreaM2: p.usableAreaM2,
    floor: p.floor,
    hasElevator: p.hasElevator,
    yearBuilt: p.yearBuilt,
    parkingSpaces: p.parkingSpaces,
    heating: p.heating ?? "",
    hasAirConditioning: p.hasAirConditioning,
    hasTerrace: p.hasTerrace,
    hasBalcony: p.hasBalcony,
    hasGarden: p.hasGarden,
    hasPool: p.hasPool,
    hasStorageRoom: p.hasStorageRoom,
    isFurnished: p.isFurnished,
    isExterior: p.isExterior,
    energyConsumptionRating: p.energyRating ?? "",
    energyConsumptionValue: p.energyConsumptionValue,
    energyEmissionsRating: p.energyEmissionsRating ?? "",
    energyEmissionsValue: p.energyEmissionsValue,
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
    <condition>${escapeXml(p.condition)}</condition>
    <price>${p.price}</price>
    <currency>${p.currency}</currency>
    <hoa_fees>${p.hoaFees ?? ""}</hoa_fees>
    <city>${escapeXml(p.city)}</city>
    <zone>${escapeXml(p.zone)}</zone>
    <address>${escapeXml(p.address)}</address>
    <latitude>${p.latitude ?? ""}</latitude>
    <longitude>${p.longitude ?? ""}</longitude>
    <bedrooms>${p.bedrooms ?? ""}</bedrooms>
    <bathrooms>${p.bathrooms ?? ""}</bathrooms>
    <area_m2>${p.areaM2 ?? ""}</area_m2>
    <usable_area_m2>${p.usableAreaM2 ?? ""}</usable_area_m2>
    <floor>${p.floor ?? ""}</floor>
    <has_elevator>${p.hasElevator ?? ""}</has_elevator>
    <year_built>${p.yearBuilt ?? ""}</year_built>
    <parking_spaces>${p.parkingSpaces ?? ""}</parking_spaces>
    <heating>${escapeXml(p.heating)}</heating>
    <has_air_conditioning>${p.hasAirConditioning ?? ""}</has_air_conditioning>
    <has_terrace>${p.hasTerrace ?? ""}</has_terrace>
    <has_balcony>${p.hasBalcony ?? ""}</has_balcony>
    <has_garden>${p.hasGarden ?? ""}</has_garden>
    <has_pool>${p.hasPool ?? ""}</has_pool>
    <has_storage_room>${p.hasStorageRoom ?? ""}</has_storage_room>
    <is_furnished>${p.isFurnished ?? ""}</is_furnished>
    <is_exterior>${p.isExterior ?? ""}</is_exterior>
    <energy_consumption_rating>${escapeXml(p.energyConsumptionRating)}</energy_consumption_rating>
    <energy_consumption_value>${p.energyConsumptionValue ?? ""}</energy_consumption_value>
    <energy_emissions_rating>${escapeXml(p.energyEmissionsRating)}</energy_emissions_rating>
    <energy_emissions_value>${p.energyEmissionsValue ?? ""}</energy_emissions_value>
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
