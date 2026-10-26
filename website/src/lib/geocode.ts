// Cuando una propiedad no tiene coordenadas, se busca la zona o la dirección en
// el buscador de OpenStreetMap (Nominatim). Se hace desde el servidor y el
// resultado se guarda 30 días, así que casi nunca se repite la consulta
// (su política pide pocas peticiones y un identificador propio).
export async function geocodePlace(place: string): Promise<{ lat: number; lon: number } | null> {
  if (!place.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&q=${encodeURIComponent(place)}`,
      {
        headers: { "User-Agent": "toledo21-web/1.0 (info@somostuinmobiliaria.es)", "Accept-Language": "es" },
        next: { revalidate: 60 * 60 * 24 * 30 },
        signal: AbortSignal.timeout(4000),
      },
    );
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
