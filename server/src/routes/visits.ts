import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { dwellingActivityInclude, dwellingLabel } from "../lib/notifications.js";
import { canUse, loadDwellingFor, officeAccess } from "./buildings.js";

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
    const rentalVisit = [
      { property: { listingType: "ALQUILER" as const } },
      { dwelling: { status: { in: ["A_ALQUILER" as const, "ALQUILADA" as const] } } },
      { dwelling: { property: { listingType: "ALQUILER" as const } } },
    ];
    const visits = await prisma.activity.findMany({
      where: {
        AND: [
          { type: "VISITA", completed: false, dueDate: { gte: since } },
          req.user!.role === "ADMIN" ? {} : { OR: [{ dwellingId: null }, { agentId: req.user!.userId }] },
          // Administración solo ve las visitas de alquiler.
          req.user!.role === "ADMINISTRACION" ? { OR: rentalVisit } : {},
          req.query.mine === "1" ? { agentId: req.user!.userId } : {},
        ],
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
    let linkedDwellingId: string | null = null;
    let linkedPropertyId: string | null = null;
    if (data.propertyId) {
      const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
      if (!property || (req.user!.role === "ADMINISTRACION" && property.listingType !== "ALQUILER")) return res.status(404).json({ error: "Inmueble no encontrado" });
      // Si ese piso también está en el mapa, la visita queda además en el diario de su vivienda.
      const mapped = await prisma.dwelling.findFirst({ where: { propertyId: property.id }, include: { building: true } });
      if (mapped && canUse(await officeAccess(req), mapped.building.office)) linkedDwellingId = mapped.id;
      label = `${property.reference} · ${property.title}`;
      address = [property.address, property.zone, property.city].filter(Boolean).join(", ") || property.title;
    } else {
      const dwelling = await loadDwellingFor(req, data.dwellingId!);
      if (!dwelling) return res.status(404).json({ error: "Vivienda no encontrada" });
      const linked = dwelling.propertyId ? await prisma.property.findUnique({ where: { id: dwelling.propertyId }, select: { listingType: true } }) : null;
      const isRental = linked ? linked.listingType === "ALQUILER" : dwelling.status === "A_ALQUILER" || dwelling.status === "ALQUILADA";
      if (req.user!.role === "ADMINISTRACION" && !isRental) return res.status(403).json({ error: "Tu perfil solo gestiona alquileres" });
      linkedPropertyId = dwelling.propertyId;
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
        propertyId: data.propertyId || linkedPropertyId,
        dwellingId: data.dwellingId || linkedDwellingId,
        location,
        agentId: req.user!.userId,
      },
    });
    res.status(201).json(activity);
  }),
);
