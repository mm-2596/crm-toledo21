import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { dwellingActivityInclude, dwellingLabel } from "../lib/notifications.js";
import { loadDwellingFor } from "./buildings.js";

export const visitsRouter = Router();

const visitInput = z
  .object({
    contactId: z.string(),
    propertyId: z.string().optional().nullable(),
    dwellingId: z.string().optional().nullable(),
    when: z.string().datetime(),
    location: z.string().trim().max(300).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((v) => Boolean(v.propertyId) !== Boolean(v.dwellingId), { message: "Indica el inmueble o la vivienda de la visita" });

/** Agenda de visitas: las próximas, con día, hora y sitio. Lo anotado en viviendas solo lo ve su responsable o un administrador. */
visitsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const visits = await prisma.activity.findMany({
      where: {
        type: "VISITA",
        completed: false,
        dueDate: { gte: since },
        ...(req.user!.role === "ADMIN" ? {} : { OR: [{ dwellingId: null }, { agentId: req.user!.userId }] }),
        ...(req.query.mine === "1" ? { agentId: req.user!.userId } : {}),
      },
      orderBy: { dueDate: "asc" },
      take: 200,
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        agent: { select: { id: true, name: true } },
        property: { select: { id: true, reference: true, title: true } },
        dwelling: dwellingActivityInclude,
      },
    });
    res.json(visits.map(({ dwelling, ...v }) => ({ ...v, dwelling: dwelling ? { id: dwelling.id, buildingId: dwelling.buildingId, label: dwellingLabel(dwelling) } : null })));
  }),
);

visitsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = visitInput.parse(req.body);
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId }, select: { id: true, name: true } });
    if (!contact) return res.status(404).json({ error: "Cliente no encontrado" });

    let label: string;
    let address: string;
    if (data.propertyId) {
      const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
      if (!property) return res.status(404).json({ error: "Inmueble no encontrado" });
      label = `${property.reference} · ${property.title}`;
      address = [property.address, property.zone, property.city].filter(Boolean).join(", ") || property.title;
    } else {
      const dwelling = await loadDwellingFor(req, data.dwellingId!);
      if (!dwelling) return res.status(404).json({ error: "Vivienda no encontrada" });
      label = dwellingLabel(dwelling);
      address = [dwelling.building.address, dwelling.building.city].filter(Boolean).join(", ");
    }

    // Por defecto se queda en la dirección del inmueble, salvo que se indique otro sitio.
    const location = data.location || address;
    const activity = await prisma.activity.create({
      data: {
        type: "VISITA",
        description: `Visita a ${label} con ${contact.name}${data.notes ? ` — ${data.notes}` : ""}`,
        dueDate: new Date(data.when),
        hasTime: true,
        contactId: contact.id,
        propertyId: data.propertyId || null,
        dwellingId: data.dwellingId || null,
        location,
        agentId: req.user!.userId,
      },
    });
    res.status(201).json(activity);
  }),
);
