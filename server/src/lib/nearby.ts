import { prisma } from "./prisma.js";

// Transporte y servicios cerca de cada propiedad, a partir de los datos abiertos de
// OpenStreetMap (Overpass). El servicio público es lento y a veces está saturado, así que
// la consulta se hace aquí, en segundo plano y con paciencia, y el resultado se guarda en
// la base de datos: la web solo lee lo ya guardado y nunca espera.
export type NearbyCategory = "metro" | "tren" | "bus" | "super" | "farmacia" | "colegio" | "salud" | "parque";

export interface NearbyPlace {
  category: NearbyCategory;
  name: string;
  meters: number;
  minutes: number;
}

const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const RADIUS = 800;
const REFRESH_AFTER_MS = 60 * 24 * 3600 * 1000;
const RETRY_AFTER_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 70_000;

type Tags = Record<string, string>;
interface Element {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Tags;
}

// Solo puntos y caminos (sin relaciones) para que la consulta sea ligera.
function buildQuery(lat: number, lon: number) {
  const a = `(around:${RADIUS},${lat},${lon})`;
  const wide = `(around:1500,${lat},${lon})`;
  return `[out:json][timeout:60];(
node["highway"="bus_stop"]${a};
node["railway"~"^(station|halt|tram_stop|subway_entrance)$"]${wide};
node["station"="subway"]${wide};
nw["shop"~"^(supermarket|convenience)$"]${a};
nw["amenity"="pharmacy"]${a};
nw["amenity"~"^(school|kindergarten)$"]${a};
nw["amenity"~"^(hospital|clinic|doctors)$"]${a};
nw["leisure"="park"]${a};
);out center 150;`;
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function classify(tags: Tags): NearbyCategory | null {
  if (tags.station === "subway" || tags.railway === "subway_entrance" || tags.railway === "tram_stop") return "metro";
  if (tags.railway === "station" || tags.railway === "halt") return "tren";
  if (tags.highway === "bus_stop") return "bus";
  if (tags.shop === "supermarket" || tags.shop === "convenience") return "super";
  if (tags.amenity === "pharmacy") return "farmacia";
  if (tags.amenity === "school" || tags.amenity === "kindergarten") return "colegio";
  if (tags.amenity === "hospital" || tags.amenity === "clinic" || tags.amenity === "doctors") return "salud";
  if (tags.leisure === "park") return "parque";
  return null;
}

const FALLBACK_NAME: Record<NearbyCategory, string> = {
  metro: "Metro / tranvía",
  tren: "Estación de tren",
  bus: "Parada de autobús",
  super: "Supermercado",
  farmacia: "Farmacia",
  colegio: "Colegio",
  salud: "Centro de salud",
  parque: "Parque",
};

/** Convierte la respuesta de Overpass en una lista ordenada de sitios cercanos (hasta 4 por tipo). */
export function parseNearby(elements: Element[], lat: number, lon: number): NearbyPlace[] {
  const best = new Map<string, NearbyPlace>();
  for (const el of elements) {
    const plat = el.lat ?? el.center?.lat;
    const plon = el.lon ?? el.center?.lon;
    if (!el.tags || plat == null || plon == null) continue;
    const category = classify(el.tags);
    if (!category) continue;
    const meters = Math.round(distance(lat, lon, plat, plon));
    const name = el.tags.name || el.tags.ref || FALLBACK_NAME[category];
    const key = `${category}|${name}`;
    const prev = best.get(key);
    if (!prev || meters < prev.meters) best.set(key, { category, name, meters, minutes: Math.max(1, Math.round(meters / 80)) });
  }
  const perCategory = new Map<NearbyCategory, number>();
  return [...best.values()]
    .sort((a, b) => a.meters - b.meters)
    .filter((p) => {
      const n = perCategory.get(p.category) ?? 0;
      perCategory.set(p.category, n + 1);
      return n < 4;
    });
}

export async function fetchNearby(lat: number, lon: number): Promise<NearbyPlace[] | null> {
  const body = `data=${encodeURIComponent(buildQuery(lat, lon))}`;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "toledo21-crm/1.0 (info@somostuinmobiliaria.es)" },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { elements?: Element[] };
      if (!Array.isArray(data.elements)) continue;
      return parseNearby(data.elements, lat, lon);
    } catch {
      // se prueba el siguiente servidor
    }
  }
  return null;
}

// Cola de uno en uno: el servicio público pide no saturarlo.
let queue: Promise<unknown> = Promise.resolve();
const inFlight = new Set<string>();
const failedAt = new Map<string, number>();

/** Lo ya guardado para una propiedad (vacío si aún no se ha calculado o la tabla no existe todavía). */
export async function getStoredNearby(propertyId: string): Promise<{ places: NearbyPlace[]; fetchedAt: Date } | null> {
  try {
    const row = await prisma.propertyNearby.findUnique({ where: { propertyId } });
    return row ? { places: row.data as unknown as NearbyPlace[], fetchedAt: row.fetchedAt } : null;
  } catch {
    return null;
  }
}

/** Calcula y guarda los sitios cercanos de una propiedad sin hacer esperar a nadie. */
export function refreshNearbyLater(propertyId: string, force = false) {
  if (inFlight.has(propertyId)) return;
  const failed = failedAt.get(propertyId);
  if (failed && Date.now() - failed < RETRY_AFTER_MS) return;
  inFlight.add(propertyId);
  queue = queue
    .then(async () => {
      const p = await prisma.property.findUnique({ where: { id: propertyId }, select: { latitude: true, longitude: true } });
      if (!p || p.latitude == null || p.longitude == null) return;
      if (!force) {
        const stored = await getStoredNearby(propertyId);
        if (stored && Date.now() - stored.fetchedAt.getTime() < REFRESH_AFTER_MS) return;
      }
      const places = await fetchNearby(p.latitude, p.longitude);
      if (!places) {
        failedAt.set(propertyId, Date.now());
        return;
      }
      failedAt.delete(propertyId);
      const data = places as unknown as object;
      await prisma.propertyNearby.upsert({
        where: { propertyId },
        create: { propertyId, data },
        update: { data, fetchedAt: new Date() },
      });
    })
    .catch((e) => {
      failedAt.set(propertyId, Date.now());
      console.error("No se pudieron calcular los sitios cercanos de", propertyId, e instanceof Error ? e.message : e);
    })
    .finally(() => inFlight.delete(propertyId));
}

/** ¿Hace falta recalcular? Sin datos guardados o con más de 60 días. */
export function isStale(stored: { fetchedAt: Date } | null) {
  return !stored || Date.now() - stored.fetchedAt.getTime() > REFRESH_AFTER_MS;
}
