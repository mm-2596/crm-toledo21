import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { UPLOADS_ROOT, uploadPropertyImage } from "../lib/upload.js";

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
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  bedrooms: z.number().int().optional().nullable(),
  bathrooms: z.number().int().optional().nullable(),
  areaM2: z.number().int().optional().nullable(),
  floor: z.number().int().optional().nullable(),
  hasElevator: z.boolean().optional().nullable(),
  energyRating: z.enum(["A", "B", "C", "D", "E", "F", "G", "EN_TRAMITE", "EXENTO"]).optional().nullable(),
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
      include: { agent: true, images: { orderBy: { order: "asc" } } },
    });
    res.json(properties);
  }),
);

propertiesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const property = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
      include: {
        agent: true,
        deals: { include: { contact: true, stage: true } },
        valuations: true,
        images: { orderBy: { order: "asc" } },
      },
    });
    if (!property) return res.status(404).json({ error: "Propiedad no encontrada" });
    res.json(property);
  }),
);

propertiesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = propertyInput.parse(req.body);
    const property = await prisma.property.create({
      data: { ...data, agentId: data.agentId ?? req.user!.userId },
    });
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
    const property = await prisma.property.findUnique({ where: { id: String(req.params.id) } });
    await prisma.property.delete({ where: { id: String(req.params.id) } });
    if (property) {
      fs.rm(path.join(UPLOADS_ROOT, "properties", property.id), { recursive: true, force: true }, () => {});
    }
    res.status(204).send();
  }),
);

propertiesRouter.post(
  "/:id/images",
  uploadPropertyImage.single("image"),
  asyncHandler(async (req, res) => {
    const propertyId = String(req.params.id);
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) return res.status(404).json({ error: "Propiedad no encontrada" });
    if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });

    const count = await prisma.propertyImage.count({ where: { propertyId } });
    const image = await prisma.propertyImage.create({
      data: {
        propertyId,
        url: `/uploads/properties/${propertyId}/${req.file.filename}`,
        order: count,
      },
    });
    res.status(201).json(image);
  }),
);

propertiesRouter.delete(
  "/:id/images/:imageId",
  asyncHandler(async (req, res) => {
    const image = await prisma.propertyImage.findUnique({ where: { id: String(req.params.imageId) } });
    if (!image || image.propertyId !== req.params.id) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }
    await prisma.propertyImage.delete({ where: { id: image.id } });
    fs.rm(path.join(UPLOADS_ROOT, image.url.replace("/uploads/", "")), () => {});
    res.status(204).send();
  }),
);
