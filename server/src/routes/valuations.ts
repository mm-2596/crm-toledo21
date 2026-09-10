import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const valuationsRouter = Router();

/**
 * Valoracion v1: metodo por comparables (media de precio/m2 de propiedades
 * similares ya cargadas en el CRM). No requiere ninguna API externa.
 *
 * Cuando se elija un proveedor de IA (Anthropic/OpenAI), este endpoint puede
 * combinar este calculo con una llamada al modelo para ajustar el resultado
 * con factores cualitativos (estado, reforma, vistas, etc.) sin cambiar el
 * contrato de la API.
 */
const estimateInput = z.object({
  propertyId: z.string().optional().nullable(),
  type: z.enum(["PISO", "CASA", "CHALET", "ATICO", "LOCAL", "OFICINA", "GARAJE", "TERRENO", "OTRO"]),
  city: z.string().min(1),
  zone: z.string().optional().nullable(),
  areaM2: z.number().int().positive(),
  bedrooms: z.number().int().optional().nullable(),
});

valuationsRouter.post(
  "/estimate",
  asyncHandler(async (req, res) => {
    const input = estimateInput.parse(req.body);

    const comparables = await prisma.property.findMany({
      where: {
        type: input.type,
        city: input.city,
        zone: input.zone ?? undefined,
        areaM2: { not: null },
        status: { not: "RETIRADO" },
        ...(input.propertyId ? { id: { not: input.propertyId } } : {}),
      },
      select: { price: true, areaM2: true },
      take: 50,
    });

    const usable = comparables.filter((c) => c.areaM2 && c.areaM2 > 0);

    if (usable.length === 0) {
      return res.status(422).json({
        error:
          "No hay suficientes propiedades comparables en el CRM para estimar un precio todavia. Anade mas propiedades de la misma zona/tipo.",
      });
    }

    const avgPricePerM2 =
      usable.reduce((sum, c) => sum + c.price / (c.areaM2 as number), 0) / usable.length;
    const estimatedValue = Math.round(avgPricePerM2 * input.areaM2);

    const valuation = await prisma.valuation.create({
      data: {
        propertyId: input.propertyId ?? null,
        source: "heuristic",
        estimatedValue,
        inputData: input,
        factors: { avgPricePerM2: Math.round(avgPricePerM2), comparablesCount: usable.length },
      },
    });

    res.status(201).json(valuation);
  }),
);

valuationsRouter.get(
  "/property/:propertyId",
  asyncHandler(async (req, res) => {
    const valuations = await prisma.valuation.findMany({
      where: { propertyId: String(req.params.propertyId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(valuations);
  }),
);
