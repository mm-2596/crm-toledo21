import type { ListingType, PropertyType } from "@prisma/client";
import { prisma } from "./prisma.js";

/**
 * Cruce demanda: dado un inmueble en venta, qué clientes buscan justo eso.
 *
 * Color según el presupuesto del cliente frente al precio del inmueble:
 *   OK       dentro del presupuesto
 *   NARANJA  hasta un 20 % fuera (por encima del máximo o por debajo del mínimo)
 *   ROJO     entre un 20 % y un 40 % fuera
 * Más allá del 40 % no se muestra. El % se mide sobre el precio del inmueble.
 */
export type PriceBand = "OK" | "NARANJA" | "ROJO" | "SIN_PRESUPUESTO";
export type Viability = "VIABLE" | "JUSTO" | "NO_VIABLE" | "SIN_DATOS";

export const NARANJA_LIMIT = 0.2;
export const ROJO_LIMIT = 0.4;

// Hipótesis de la estimación de viabilidad (orientativa, no es una oferta de financiación).
const DOWN_PAYMENT = 0.2; // entrada
const PURCHASE_COSTS = 0.1; // impuestos, notaría, registro…
const LTV = 1 - DOWN_PAYMENT; // se financia el 80 %
const MAX_EFFORT = 0.35; // la cuota no debe pasar del 35 % de lo que le queda al mes
const MORTGAGE_RATE = 0.035;
const MORTGAGE_YEARS = 30;
const monthlyRate = MORTGAGE_RATE / 12;
const payments = MORTGAGE_YEARS * 12;
/** Cuota mensual por cada euro prestado. */
export const PAYMENT_FACTOR = monthlyRate / (1 - Math.pow(1 + monthlyRate, -payments));

export interface Target {
  type: PropertyType;
  listingType: ListingType;
  price: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
  /** Ciudad, zona y dirección en minúsculas, para comparar con las zonas que busca el cliente. */
  place: string;
}

export interface Finances {
  savings: number | null;
  monthlyIncome: number | null;
  monthlyDebts: number | null;
  needsFinancing: boolean | null;
}

export function priceBand(price: number, min: number | null, max: number | null): { band: PriceBand; deviation: number } | null {
  if (min == null && max == null) return { band: "SIN_PRESUPUESTO", deviation: 0 };
  const over = max != null && price > max ? (price - max) / price : 0;
  const under = min != null && price < min ? (min - price) / price : 0;
  const deviation = Math.max(over, under);
  if (deviation === 0) return { band: "OK", deviation };
  if (deviation <= NARANJA_LIMIT) return { band: "NARANJA", deviation };
  if (deviation <= ROJO_LIMIT) return { band: "ROJO", deviation };
  return null;
}

export function viability(f: Finances, price: number, listingType: ListingType): { status: Viability; detail: string } {
  const eur = (n: number) => `${Math.round(n).toLocaleString("es-ES")} €`;
  const net = f.monthlyIncome != null ? Math.max(0, f.monthlyIncome - (f.monthlyDebts ?? 0)) : null;

  if (listingType === "ALQUILER") {
    if (net == null) return { status: "SIN_DATOS", detail: "Faltan sus ingresos mensuales" };
    const ratio = price / (net || 1);
    const status: Viability = net > 0 && ratio <= 0.35 ? "VIABLE" : net > 0 && ratio <= 0.45 ? "JUSTO" : "NO_VIABLE";
    return { status, detail: `La renta (${eur(price)}) es el ${Math.round(ratio * 100)} % de lo que le queda al mes` };
  }

  if (f.needsFinancing === false) {
    if (f.savings == null) return { status: "SIN_DATOS", detail: "Faltan sus ahorros" };
    const need = price * (1 + PURCHASE_COSTS);
    const cover = f.savings / need;
    return { status: cover >= 1 ? "VIABLE" : cover >= 0.85 ? "JUSTO" : "NO_VIABLE", detail: `Al contado necesita ${eur(need)} con gastos; tiene ${eur(f.savings)}` };
  }

  if (f.savings == null || net == null) {
    return { status: "SIN_DATOS", detail: `Faltan ${f.savings == null ? "sus ahorros" : "sus ingresos mensuales"}` };
  }
  const entry = price * (DOWN_PAYMENT + PURCHASE_COSTS);
  const savingsCover = f.savings / entry;
  const payment = price * LTV * PAYMENT_FACTOR;
  const capacity = net * MAX_EFFORT;
  const effort = capacity > 0 ? payment / capacity : Infinity;
  const status: Viability = savingsCover >= 1 && effort <= 1 ? "VIABLE" : savingsCover < 0.6 || effort > 1.3 ? "NO_VIABLE" : "JUSTO";
  return {
    status,
    detail: `Entrada y gastos: ${eur(entry)} (tiene ${eur(f.savings)}). Cuota estimada: ${eur(payment)}/mes de ${eur(capacity)} que puede dedicar`,
  };
}

/** Precio máximo que podría permitirse, según sus datos (para enseñarlo en su ficha). */
export function affordability(f: Finances, listingType: ListingType): { maxPrice: number | null; note: string } {
  const net = f.monthlyIncome != null ? Math.max(0, f.monthlyIncome - (f.monthlyDebts ?? 0)) : null;
  if (listingType === "ALQUILER") {
    return net == null ? { maxPrice: null, note: "Faltan sus ingresos mensuales" } : { maxPrice: Math.floor(net * 0.35), note: "Renta mensual máxima (35 % de lo que le queda al mes)" };
  }
  if (f.needsFinancing === false) {
    return f.savings == null ? { maxPrice: null, note: "Faltan sus ahorros" } : { maxPrice: Math.floor(f.savings / (1 + PURCHASE_COSTS)), note: "Compra al contado, incluidos los gastos" };
  }
  if (f.savings == null || net == null) return { maxPrice: null, note: "Faltan sus ahorros o ingresos mensuales" };
  const byEntry = f.savings / (DOWN_PAYMENT + PURCHASE_COSTS);
  const byPayment = (net * MAX_EFFORT) / PAYMENT_FACTOR / LTV;
  return { maxPrice: Math.floor(Math.min(byEntry, byPayment)), note: "Con hipoteca del 80 %, 30 años a ~3,5 %" };
}

const bandRank: Record<PriceBand, number> = { OK: 0, SIN_PRESUPUESTO: 1, NARANJA: 2, ROJO: 3 };
const viabilityRank: Record<Viability, number> = { VIABLE: 0, JUSTO: 1, SIN_DATOS: 2, NO_VIABLE: 3 };

export interface MatchItem {
  contactId: string;
  name: string;
  phone: string | null;
  email: string | null;
  priority: string | null;
  band: PriceBand;
  deviationPct: number;
  budget: string;
  search: string;
  viability: Viability;
  viabilityDetail: string;
  warnings: string[];
}

const eurShort = (n: number) => `${n.toLocaleString("es-ES")} €`;

export async function findMatches(target: Target): Promise<MatchItem[]> {
  const contacts = await prisma.contact.findMany({
    where: { OR: [{ segment: null }, { segment: { not: "HA_COMPRADO" } }] },
    include: { searches: { where: { active: true } } },
  });

  const items: MatchItem[] = [];
  for (const c of contacts) {
    // Quien aún no tiene búsquedas guardadas usa los datos antiguos de su ficha como una búsqueda.
    const searches =
      c.searches.length > 0
        ? c.searches.map((s) => ({ ...s, propertyType: s.propertyType as PropertyType | null }))
        : c.budgetMax != null || c.propertyType || c.preferredZone
          ? [{ id: "legacy", propertyType: c.propertyType, listingType: c.listingType ?? "VENTA", budgetMin: c.budgetMin, budgetMax: c.budgetMax, zones: c.preferredZone, bedroomsMin: c.bedroomsMin, bathroomsMin: null as number | null, areaMin: null as number | null }]
          : [];

    let best: { item: MatchItem; score: number } | null = null;
    for (const s of searches) {
      if (s.listingType !== target.listingType) continue;
      if (s.propertyType && s.propertyType !== target.type) continue;
      const fit = priceBand(target.price, s.budgetMin, s.budgetMax);
      if (!fit) continue;

      const warnings: string[] = [];
      if (s.bedroomsMin != null && target.bedrooms != null && target.bedrooms < s.bedroomsMin) warnings.push(`Tiene ${target.bedrooms} hab. y busca ${s.bedroomsMin}+`);
      if (s.bathroomsMin != null && target.bathrooms != null && target.bathrooms < s.bathroomsMin) warnings.push(`Tiene ${target.bathrooms} baños y busca ${s.bathroomsMin}+`);
      if (s.areaMin != null && target.areaM2 != null && target.areaM2 < s.areaMin) warnings.push(`Tiene ${target.areaM2} m² y busca ${s.areaMin}+`);
      const zones = (s.zones ?? "").split(",").map((z) => z.trim().toLowerCase()).filter(Boolean);
      if (zones.length > 0 && !zones.some((z) => target.place.includes(z))) warnings.push(`Busca en ${s.zones}`);

      const v = viability(c, target.price, target.listingType);
      const budget =
        s.budgetMin != null && s.budgetMax != null ? `${eurShort(s.budgetMin)} – ${eurShort(s.budgetMax)}` : s.budgetMax != null ? `hasta ${eurShort(s.budgetMax)}` : s.budgetMin != null ? `desde ${eurShort(s.budgetMin)}` : "sin presupuesto";
      const item: MatchItem = {
        contactId: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        priority: c.priority,
        band: fit.band,
        deviationPct: Math.round(fit.deviation * 100),
        budget,
        search: [s.bedroomsMin ? `${s.bedroomsMin}+ hab.` : null, s.zones].filter(Boolean).join(" · ") || "Sin más requisitos",
        viability: v.status,
        viabilityDetail: v.detail,
        warnings,
      };
      const score = bandRank[fit.band] * 100 + warnings.length * 10 + viabilityRank[v.status];
      if (!best || score < best.score) best = { item, score };
    }
    if (best) items.push(best.item);
  }

  const priorityRank: Record<string, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };
  return items.sort(
    (a, b) =>
      bandRank[a.band] - bandRank[b.band] ||
      a.warnings.length - b.warnings.length ||
      viabilityRank[a.viability] - viabilityRank[b.viability] ||
      (priorityRank[a.priority ?? ""] ?? 3) - (priorityRank[b.priority ?? ""] ?? 3) ||
      a.name.localeCompare(b.name, "es"),
  );
}
