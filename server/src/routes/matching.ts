import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { findMatches } from "../lib/matching.js";
import { loadDwellingFor } from "./buildings.js";

export const matchesRouter = Router();

const place = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" ").toLowerCase();

matchesRouter.get(
  "/property/:id",
  asyncHandler(async (req, res) => {
    const property = await prisma.property.findUnique({ where: { id: String(req.params.id) } });
    if (!property) return res.status(404).json({ error: "Inmueble no encontrado" });
    const matches = await findMatches({
      type: property.type,
      listingType: property.listingType,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaM2: property.areaM2,
      place: place(property.city, property.zone, property.address),
    });
    res.json({ price: property.price, listingType: property.listingType, matches });
  }),
);

matchesRouter.get(
  "/dwelling/:id",
  asyncHandler(async (req, res) => {
    const dwelling = await loadDwellingFor(req, String(req.params.id));
    if (!dwelling) return res.status(404).json({ error: "Vivienda no encontrada" });
    if (!dwelling.price) return res.json({ price: null, listingType: "VENTA", needsPrice: true, matches: [] });
    const matches = await findMatches({
      type: dwelling.propertyType ?? "PISO",
      listingType: "VENTA",
      price: dwelling.price,
      bedrooms: dwelling.bedrooms,
      bathrooms: dwelling.bathrooms,
      areaM2: dwelling.areaM2,
      place: place(dwelling.building.city, dwelling.building.address, dwelling.building.name),
    });
    res.json({ price: dwelling.price, listingType: "VENTA", needsPrice: false, matches });
  }),
);
