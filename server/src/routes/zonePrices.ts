import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { estimateValuation, findZone, EXTRA_BONUS, RANGE_MARGIN } from "../lib/valuation.js";

export const zonePricesRouter = Router();

const zoneInput = z.object({
  city: z.string().trim().min(1).max(80),
  zone: z.string().trim().max(80).optional().nullable(),
  saleEurM2: z.number().int().min(300).max(30000),
  notes: z.string().trim().max(300).optional().nullable(),
  active: z.boolean().optional(),
});

const clean = (d: z.infer<typeof zoneInput>) => ({ ...d, zone: d.zone ? d.zone : null, notes: d.notes ? d.notes : null });

/** Una misma zona (o ciudad sin zona) no puede estar dos veces: así el cálculo nunca duda entre dos precios. */
async function duplicate(city: string, zone: string | null, exceptId?: string) {
  const norm = (t: string) => t.trim().toLowerCase();
  const rows = await prisma.zonePrice.findMany({ where: exceptId ? { id: { not: exceptId } } : {} });
  return rows.some((r) => norm(r.city) === norm(city) && norm(r.zone ?? "") === norm(zone ?? ""));
}

zonePricesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.zonePrice.findMany({ orderBy: [{ city: "asc" }, { zone: "asc" }] });
    res.json({ rows, adjustments: { extras: EXTRA_BONUS, margin: RANGE_MARGIN } });
  }),
);

zonePricesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = clean(zoneInput.parse(req.body));
    if (await duplicate(data.city, data.zone)) return res.status(409).json({ error: "Esa zona ya tiene un precio. Edítalo en la lista." });
    res.status(201).json(await prisma.zonePrice.create({ data }));
  }),
);

zonePricesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const data = clean(zoneInput.parse(req.body));
    if (await duplicate(data.city, data.zone, id)) return res.status(409).json({ error: "Esa zona ya tiene un precio. Edítalo en la lista." });
    res.json(await prisma.zonePrice.update({ where: { id }, data }));
  }),
);

zonePricesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.zonePrice.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);

const previewInput = z.object({
  type: z.enum(["Piso", "Casa o chalet", "Local u oficina", "Terreno u otro"]).default("Piso"),
  address: z.string().trim().max(200).default(""),
  zoneId: z.string().optional().nullable(),
  areaM2: z.number().positive(),
  condition: z.string().optional().nullable(),
  extras: z.array(z.string()).default([]),
});

/** Prueba el cálculo con los precios guardados, sin crear ningún contacto ni enviar nada. */
zonePricesRouter.post(
  "/preview",
  asyncHandler(async (req, res) => {
    const input = previewInput.parse(req.body);
    const rows = await prisma.zonePrice.findMany({ where: { active: true } });
    const zone = findZone(rows, input);
    res.json({ zone: zone ? [zone.zone, zone.city].filter(Boolean).join(", ") : null, estimate: estimateValuation(rows, input) });
  }),
);
