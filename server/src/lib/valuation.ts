// Valoración orientativa por zona: precio por metro cuadrado de la zona, ajustado por estado y
// extras, con un margen alrededor. Es una estimación automática, no una tasación oficial.

export interface ZoneRow {
  id: string;
  city: string;
  zone: string | null;
  saleEurM2: number;
  active: boolean;
}

export interface ValuationInput {
  /** Tipo que elige la persona en la web: "Piso", "Casa o chalet", "Local u oficina", "Terreno u otro". */
  type: string;
  address: string;
  zoneId?: string | null;
  areaM2: number;
  condition?: string | null;
  extras?: string[];
}

export interface ValuationResult {
  low: number;
  high: number;
  mid: number;
  eurM2: number;
  zoneLabel: string;
  factors: { condition: number; extras: number };
}

/** Margen por encima y por debajo de la estimación central. */
export const RANGE_MARGIN = 0.07;
const MIN_AREA = 25;
const MAX_AREA = 500;

const CONDITION_FACTOR: Record<string, number> = {
  Nuevo: 1.08,
  Reformado: 1.05,
  "Buen estado": 1,
  "A reformar": 0.88,
};

export const EXTRA_BONUS: Record<string, number> = {
  Ascensor: 0.03,
  Terraza: 0.03,
  Garaje: 0.05,
  Trastero: 0.015,
  Piscina: 0.04,
  Jardín: 0.04,
};
const EXTRAS_CAP = 0.12;

/** Solo viviendas: para locales, terrenos y otros no se da precio (lo prepara un asesor). */
const ESTIMABLE_TYPES = new Set(["Piso", "Casa o chalet"]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Elige la fila de precios que corresponde: la zona elegida, o la más concreta que aparezca en la dirección. */
export function findZone(rows: ZoneRow[], input: Pick<ValuationInput, "address" | "zoneId">): ZoneRow | null {
  const active = rows.filter((r) => r.active && r.saleEurM2 > 0);
  if (input.zoneId) {
    const chosen = active.find((r) => r.id === input.zoneId);
    if (chosen) return chosen;
  }
  const text = ` ${normalize(input.address)} `;
  const byZone = active
    .filter((r) => r.zone && text.includes(` ${normalize(r.zone)} `))
    .sort((a, b) => normalize(b.zone!).length - normalize(a.zone!).length);
  if (byZone[0]) return byZone[0];
  const byCity = active.filter((r) => !r.zone && text.includes(` ${normalize(r.city)} `));
  return byCity[0] ?? null;
}

function roundDown(n: number) {
  return Math.floor(n / 1000) * 1000;
}
function roundUp(n: number) {
  return Math.ceil(n / 1000) * 1000;
}

export function estimateValuation(rows: ZoneRow[], input: ValuationInput): ValuationResult | null {
  if (!ESTIMABLE_TYPES.has(input.type)) return null;
  if (!Number.isFinite(input.areaM2) || input.areaM2 < MIN_AREA || input.areaM2 > MAX_AREA) return null;
  const zone = findZone(rows, input);
  if (!zone) return null;

  const condition = CONDITION_FACTOR[input.condition ?? ""] ?? 1;
  const extrasBonus = Math.min(
    (input.extras ?? []).reduce((sum, e) => sum + (EXTRA_BONUS[e] ?? 0), 0),
    EXTRAS_CAP,
  );
  const mid = zone.saleEurM2 * input.areaM2 * condition * (1 + extrasBonus);

  return {
    low: roundDown(mid * (1 - RANGE_MARGIN)),
    high: roundUp(mid * (1 + RANGE_MARGIN)),
    mid: Math.round(mid),
    eurM2: zone.saleEurM2,
    zoneLabel: [zone.zone, zone.city].filter(Boolean).join(", "),
    factors: { condition, extras: extrasBonus },
  };
}
