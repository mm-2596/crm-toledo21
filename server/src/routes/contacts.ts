import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const contactsRouter = Router();

const contactInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  source: z
    .enum(["WEB_HOUZEZ", "MANUAL", "WHATSAPP", "EMAIL", "PHONE", "REFERRAL", "OTHER"])
    .optional(),
  budgetMin: z.number().int().optional().nullable(),
  budgetMax: z.number().int().optional().nullable(),
  preferredZone: z.string().optional().nullable(),
  propertyType: z
    .enum(["PISO", "CASA", "CHALET", "ATICO", "LOCAL", "OFICINA", "GARAJE", "TERRENO", "OTRO"])
    .optional()
    .nullable(),
  listingType: z.enum(["VENTA", "ALQUILER"]).optional().nullable(),
  notes: z.string().optional().nullable(),
});

contactsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    const contacts = await prisma.contact.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: String(q) } },
              { email: { contains: String(q) } },
              { phone: { contains: String(q) } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { deals: { include: { stage: true } } },
    });
    res.json(contacts);
  }),
);

contactsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const contact = await prisma.contact.findUnique({
      where: { id: String(req.params.id) },
      include: {
        deals: { include: { stage: true, property: true } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!contact) return res.status(404).json({ error: "Contacto no encontrado" });
    res.json(contact);
  }),
);

contactsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = contactInput.parse(req.body);
    const contact = await prisma.contact.create({ data });
    res.status(201).json(contact);
  }),
);

contactsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = contactInput.partial().parse(req.body);
    const contact = await prisma.contact.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json(contact);
  }),
);

contactsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.contact.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);
