// Transporte y servicios cerca de una vivienda, a partir de los datos abiertos
// de OpenStreetMap (Overpass). Se pide desde el servidor y se guarda 7 días,
// de modo que cada ficha hace como mucho una consulta por semana.
export type NearbyCategory = "metro" | "tren" | "bus" | "super" | "farmacia" | "colegio" | "salud" | "parque";

export interface NearbyPlace {
  category: NearbyCategory;
  name: string;
  meters: number;
  minutes: number;
}

const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

function query(lat: number, lon: number) {
  const r = 900;
  const a = `(around:${r},${lat},${lon})`;
  return `[out:json][timeout:12];(
node["highway"="bus_stop"]${a};
node["railway"~"^(station|halt|tram_stop|subway_entrance)$"]${a};
node["station"="subway"]${a};
nwr["shop"~"^(supermarket|convenience)$"]${a};
nwr["amenity"="pharmacy"]${a};
nwr["amenity"~"^(school|kindergarten)$"]${a};
nwr["amenity"~"^(hospital|clinic|doctors)$"]${a};
nwr["leisure"="park"]${a};
);out center 120;`;
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type Tags = Record<string, string>;

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

export async function getNearby(lat: number, lon: number): Promise<NearbyPlace[]> {
  const body = `data=${encodeURIComponent(query(lat, lon))}`;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "toledo21-web/1.0 (info@somostuinmobiliaria.es)" },
        body,
        next: { revalidate: 60 * 60 * 24 * 7 },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        elements: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Tags }[];
      };
      const best = new Map<string, NearbyPlace>();
      for (const el of data.elements) {
        const tags = el.tags;
        const plat = el.lat ?? el.center?.lat;
        const plon = el.lon ?? el.center?.lon;
        if (!tags || plat == null || plon == null) continue;
        const category = classify(tags);
        if (!category) continue;
        const meters = Math.round(distance(lat, lon, plat, plon));
        const name = tags.name || tags.ref || FALLBACK_NAME[category];
        const key = `${category}|${name}`;
        const prev = best.get(key);
        if (!prev || meters < prev.meters) {
          best.set(key, { category, name, meters, minutes: Math.max(1, Math.round(meters / 80)) });
        }
      }
      return [...best.values()].sort((a, b) => a.meters - b.meters);
    } catch {
      // se prueba el siguiente servidor
    }
  }
  return [];
}
