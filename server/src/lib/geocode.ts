import { prisma } from "./prisma.js";
import { refreshNearbyLater } from "./nearby.js";

// Coloca cada propiedad en el mapa a partir de su dirección, zona y ciudad.
// Usa el buscador de OpenStreetMap (Nominatim), que pide como mucho una consulta
// por segundo y un identificador propio, por eso todo pasa por una cola.
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const MIN_GAP_MS = 1100;
const RETRY_AFTER_MS = 60 * 60 * 1000;

let queue: Promise<unknown> = Promise.resolve();
const inFlight = new Set<string>();
const failedAt = new Map<string, number>();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.then(() => new Promise((r) => setTimeout(r, MIN_GAP_MS)), () => new Promise((r) => setTimeout(r, MIN_GAP_MS)));
  return run;
}

export async function geocodePlace(query: string): Promise<{ lat: number; lon: number } | null> {
  if (!query.trim()) return null;
  try {
    const res = await fetch(`${NOMINATIM}?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "toledo21-crm/1.0 (info@somostuinmobiliaria.es)", "Accept-Language": "es" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    const first = data[0];
    if (!first) return null;
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  } catch {
    return null;
  }
}

/**
 * Busca las coordenadas de una propiedad y las guarda, sin que quien la edita tenga que esperar.
 * Con `force` las recalcula (al cambiar la dirección); si no, solo rellena las que faltan.
 */
export function geocodePropertyLater(propertyId: string, force = false) {
  if (inFlight.has(propertyId)) return;
  const failed = failedAt.get(propertyId);
  if (!force && failed && Date.now() - failed < RETRY_AFTER_MS) return;
  inFlight.add(propertyId);
  enqueue(async () => {
    const p = await prisma.property.findUnique({ where: { id: propertyId }, select: { address: true, zone: true, city: true, latitude: true, longitude: true } });
    if (!p) return;
    if (!force && p.latitude != null && p.longitude != null) return;
    const found = await geocodePlace([p.address, p.zone, p.city].filter(Boolean).join(", "));
    if (!found) {
      failedAt.set(propertyId, Date.now());
      return;
    }
    failedAt.delete(propertyId);
    await prisma.property.update({ where: { id: propertyId }, data: { latitude: found.lat, longitude: found.lon } });
    refreshNearbyLater(propertyId, true);
  })
    .catch((e) => console.error("No se pudieron calcular las coordenadas de", propertyId, e instanceof Error ? e.message : e))
    .finally(() => inFlight.delete(propertyId));
}
