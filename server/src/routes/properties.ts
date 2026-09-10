import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const propertiesRouter = Router();

const propertyInput = z.object({
  reference: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["PISO", "CASA", "CHALET", "ATICO", "LOCAL", "OFICINA", "GARAJE", "TERRENO", "OTRO"]),
  listingType: z.enum(["VENTA", "ALQUILER"]).optional(),
  status: z.enum(["DISPONIBLE", "RESERVADO", "VENDIDO", "ALQUILADO", "RETIRADO"]).optional(),
  price: z.number().int().nonnegative(),
  city: z.string().optional().nullable(),
  zone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bedrooms: z.number().int().optional().nullable(),
  bathrooms: z.number().int().optional().nullable(),
  areaM2: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
});

propertiesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, status, city } = req.query;
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { title: { contains: String(q) } },
                  { reference: { contains: String(q) } },
                  { city: { contains: String(q) } },
                ],
              }
            : {},
          status ? { status: String(status) as never } : {},
          city ? { city: String(city) } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { agent: true },
    });
    res.json(properties);
  }),
);

propertiesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const property = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
      include: { agent: true, deals: { include: { contact: true, stage: true } }, valuations: true },
    });
    if (!property) return res.status(404).json({ error: "Propiedad no encontrada" });
    res.json(property);
  }),
);

propertiesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = propertyInput.parse(req.body);
    const property = await prisma.property.create({ data });
    res.status(201).json(property);
  }),
);

propertiesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = propertyInput.partial().parse(req.body);
    const property = await prisma.property.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json(property);
  }),
);

propertiesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.property.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);
