import type { Property } from "../api/types";
import { propertyTypeLabels } from "./format";

/**
 * Generador de descripciones por plantilla (sin IA externa). Sustituible más
 * adelante por una llamada real a un proveedor de IA sin cambiar quien lo usa.
 */
export function generateDescription(property: Pick<Property, "type" | "city" | "zone" | "areaM2" | "bedrooms" | "bathrooms" | "listingType" | "price">): string {
  const typeLabel = propertyTypeLabels[property.type]?.toLowerCase() ?? "inmueble";
  const location = [property.zone, property.city].filter(Boolean).join(", ");
  const operation = property.listingType === "ALQUILER" ? "en alquiler" : "en venta";

  const parts: string[] = [];
  parts.push(
    `${capitalize(typeLabel)} ${operation}${location ? ` en ${location}` : ""}${
      property.areaM2 ? ` de ${property.areaM2} m²` : ""
    }.`,
  );

  const features: string[] = [];
  if (property.bedrooms) features.push(`${property.bedrooms} habitaciones`);
  if (property.bathrooms) features.push(`${property.bathrooms} baños`);
  if (features.length > 0) parts.push(`Cuenta con ${features.join(" y ")}.`);

  parts.push("Una oportunidad a tener en cuenta por su ubicación y distribución.");
  parts.push("Contacta con nosotros para más información o para concertar una visita.");

  return parts.join(" ");
}

/**
 * Mejora heurística de un texto ya escrito: limpia espacios, capitaliza
 * frases y añade una llamada a la acción si falta.
 */
export function improveDescription(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;

  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => capitalize(s.trim()))
    .filter(Boolean);

  const hasCallToAction = /contact|visita|informaci[oó]n/i.test(trimmed);
  if (!hasCallToAction) {
    sentences.push("Contacta con nosotros para más información o para concertar una visita.");
  }

  return sentences.join(" ");
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
