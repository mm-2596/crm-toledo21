import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import type { Office, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const buildingsRouter = Router();
export const dwellingsRouter = Router();

const OFFICES = ["GETAFE", "LEGANES", "LAS_ROZAS", "PUERTO_SAGUNTO"] as const;
const STATUSES = ["CENSADA", "A_LA_VENTA", "VENDIDA"] as const;

/**
 * Hay datos personales de propietarios y vecinos: los administradores ven todas
 * las oficinas y cada agente solo la suya. Un agente sin oficina asignada no ve
 * nada (mejor un aviso que enseñar datos de más). Se mira en la base de datos y
 * no en el token, para que un cambio de oficina surta efecto al instante.
 */
async function officeAccess(req: Request): Promise<"ALL" | Office | null> {
  if (req.user!.role === "ADMIN") return "ALL";
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { office: true, active: true } });
  return user?.active && user.office ? user.office : null;
}

function canUse(access: "ALL" | Office | null, office: Office): boolean {
  return access === "ALL" || access === office;
}

const buildingInput = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().max(80).optional().nullable(),
  office: z.enum(OFFICES),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const dwellingInput = z.object({
  floor: z.string().trim().max(20).optional().nullable(),
  door: z.string().trim().max(20).optional().nullable(),
  status: z.enum(STATUSES).optional(),
  contactId: z.string().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const withDwellings = {
  dwellings: {
    orderBy: [{ floor: "asc" as const }, { door: "asc" as const }],
    include: { contact: { select: { id: true, name: true } } },
  },
} satisfies Prisma.BuildingInclude;

buildingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const access = await officeAccess(req);
    if (access === null) return res.json({ buildings: [], noOffice: true });

    const q = String(req.query.q || "").trim();
    const requested = OFFICES.find((o) => o === req.query.office);
    const where: Prisma.BuildingWhereInput = {
      AND: [
        access === "ALL" ? (requested ? { office: requested } : {}) : { office: access },
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { address: { contains: q, mode: "insensitive" } },
                { dwellings: { some: { contact: { name: { contains: q, mode: "insensitive" } } } } },
                { dwellings: { some: { notes: { contains: q, mode: "insensitive" } } } },
              ],
            }
          : {},
      ],
    };
    const buildings = await prisma.building.findMany({ where, include: withDwellings, orderBy: { name: "asc" }, take: 500 });
    res.json({ buildings, noOffice: false });
  }),
);

buildingsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = buildingInput.parse(req.body);
    if (!canUse(await officeAccess(req), data.office)) return res.status(403).json({ error: "No puedes crear edificios en esa oficina" });
    const building = await prisma.building.create({ data: { ...data, city: data.city || null }, include: withDwellings });
    res.status(201).json(building);
  }),
);

buildingsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const existing = await prisma.building.findUnique({ where: { id } });
    const access = await officeAccess(req);
    if (!existing || !canUse(access, existing.office)) return res.status(404).json({ error: "Edificio no encontrado" });
    const data = buildingInput.parse(req.body);
    if (!canUse(access, data.office)) return res.status(403).json({ error: "No puedes mover el edificio a esa oficina" });
    const building = await prisma.building.update({ where: { id }, data: { ...data, city: data.city || null }, include: withDwellings });
    res.json(building);
  }),
);

buildingsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "ADMIN") return res.status(403).json({ error: "Solo un administrador puede borrar un edificio" });
    await prisma.building.deleteMany({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);

async function loadDwellingFor(req: Request, id: string) {
  const dwelling = await prisma.dwelling.findUnique({ where: { id }, include: { building: true } });
  if (!dwelling || !canUse(await officeAccess(req), dwelling.building.office)) return null;
  return dwelling;
}

dwellingsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { buildingId, ...rest } = z.object({ buildingId: z.string() }).merge(dwellingInput).parse(req.body);
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building || !canUse(await officeAccess(req), building.office)) return res.status(404).json({ error: "Edificio no encontrado" });
    const dwelling = await prisma.dwelling.create({
      data: { ...rest, floor: rest.floor || null, door: rest.door || null, contactId: rest.contactId || null, notes: rest.notes || null, buildingId },
      include: { contact: { select: { id: true, name: true } } },
    });
    res.status(201).json(dwelling);
  }),
);

dwellingsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await loadDwellingFor(req, id))) return res.status(404).json({ error: "Vivienda no encontrada" });
    const data = dwellingInput.parse(req.body);
    const dwelling = await prisma.dwelling.update({
      where: { id },
      data: { ...data, floor: data.floor || null, door: data.door || null, contactId: data.contactId || null, notes: data.notes || null },
      include: { contact: { select: { id: true, name: true } } },
    });
    res.json(dwelling);
  }),
);

dwellingsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await loadDwellingFor(req, id))) return res.status(404).json({ error: "Vivienda no encontrada" });
    await prisma.dwelling.delete({ where: { id } });
    res.status(204).send();
  }),
);
