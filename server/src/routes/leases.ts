import { Router } from "express";
import type { Request } from "express";
import multer from "multer";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { dwellingLabel } from "../lib/notifications.js";
import { syncDwellingFromProperty } from "../lib/linking.js";
import { canUse, officeAccess, uploadDwellingFile } from "./buildings.js";

export const leasesRouter = Router();

const OFFICES = ["GETAFE", "LEGANES", "LAS_ROZAS", "PUERTO_SAGUNTO"] as const;
const REMINDER_DAYS = [90, 30] as const;

const dwellingSelect = { id: true, floor: true, door: true, building: { select: { id: true, name: true, address: true, city: true, office: true } } } as const;
const leaseInclude = {
  dwelling: { select: dwellingSelect },
  owner: { select: { id: true, name: true, phone: true, email: true } },
  tenant: { select: { id: true, name: true, phone: true, email: true } },
  files: { select: { id: true, name: true, mimeType: true, size: true, createdAt: true }, orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.LeaseInclude;

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida");
const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

const leaseInput = z.object({
  ownerId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  monthlyRent: z.number().int().min(0).max(1_000_000),
  deposit: z.number().int().min(0).max(10_000_000).optional().nullable(),
  startDate: isoDay,
  endDate: isoDay.optional().nullable(),
  status: z.enum(["VIGENTE", "FINALIZADO"]).optional(),
  notes: z.string().trim().max(3000).optional().nullable(),
});

async function loadLease(req: Request, id: string) {
  const lease = await prisma.lease.findUnique({ where: { id }, include: leaseInclude });
  if (!lease || !canUse(await officeAccess(req), lease.dwelling.building.office)) return null;
  return lease;
}

/** La vivienda aparece como alquilada en el mapa mientras tenga un alquiler vigente. */
async function syncDwellingStatus(dwellingId: string) {
  const active = await prisma.lease.count({ where: { dwellingId, status: "VIGENTE" } });
  const dwelling = await prisma.dwelling.findUnique({ where: { id: dwellingId }, select: { status: true, propertyId: true } });
  if (!dwelling) return;
  if (active > 0 && dwelling.status !== "ALQUILADA") await prisma.dwelling.update({ where: { id: dwellingId }, data: { status: "ALQUILADA" } });
  if (active === 0 && dwelling.status === "ALQUILADA") await prisma.dwelling.update({ where: { id: dwellingId }, data: { status: "CENSADA" } });
  // Si la vivienda tiene ficha en Propiedades, su estado manda: p. ej. vuelve a «en alquiler».
  if (active === 0 && dwelling.propertyId) await syncDwellingFromProperty(dwelling.propertyId);
}

/** Avisos automáticos de fin de contrato (a los 90 y 30 días). Se recalculan cada vez que cambian las fechas. */
async function syncReminders(lease: { id: string; dwellingId: string; status: string; endDate: Date | null }, label: string, userId: string) {
  await prisma.activity.deleteMany({ where: { leaseId: lease.id, autoKind: { in: REMINDER_DAYS.map((d) => `LEASE_END_${d}`) }, completed: false } });
  if (lease.status !== "VIGENTE" || !lease.endDate) return;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const days of REMINDER_DAYS) {
    const due = new Date(lease.endDate.getTime() - days * 86_400_000);
    if (due < today) continue;
    await prisma.activity.create({
      data: {
        type: "TAREA",
        description: `El alquiler termina en ${days} días (${label}). Contactar con propietario y arrendatario para renovar o revisar la renta.`,
        dueDate: due,
        hasTime: false,
        leaseId: lease.id,
        dwellingId: lease.dwellingId,
        autoKind: `LEASE_END_${days}`,
        agentId: userId,
      },
    });
  }
}

leasesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const access = await officeAccess(req);
    if (access === null) return res.json([]);
    const q = String(req.query.q || "").trim();
    const requested = OFFICES.find((o) => o === req.query.office);
    const status = req.query.status === "VIGENTE" || req.query.status === "FINALIZADO" ? req.query.status : undefined;
    const endingWithin = Number(req.query.endingWithin);
    const where: Prisma.LeaseWhereInput = {
      AND: [
        { dwelling: { building: { office: access === "ALL" ? requested ?? undefined : access } } },
        status ? { status } : {},
        endingWithin > 0 ? { status: "VIGENTE", endDate: { not: null, lte: new Date(Date.now() + endingWithin * 86_400_000) } } : {},
        q
          ? {
              OR: [
                { owner: { name: { contains: q, mode: "insensitive" } } },
                { tenant: { name: { contains: q, mode: "insensitive" } } },
                { dwelling: { building: { address: { contains: q, mode: "insensitive" } } } },
                { dwelling: { building: { name: { contains: q, mode: "insensitive" } } } },
                { notes: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };
    const leases = await prisma.lease.findMany({
      where,
      include: { ...leaseInclude, files: { select: { id: true } } },
      orderBy: endingWithin > 0 ? { endDate: "asc" } : { createdAt: "desc" },
      take: 500,
    });
    res.json(leases);
  }),
);

leasesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const lease = await loadLease(req, String(req.params.id));
    if (!lease) return res.status(404).json({ error: "Alquiler no encontrado" });
    res.json(lease);
  }),
);

leasesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { dwellingId, ...rest } = z.object({ dwellingId: z.string() }).merge(leaseInput).parse(req.body);
    const dwelling = await prisma.dwelling.findUnique({ where: { id: dwellingId }, include: { building: true } });
    if (!dwelling || !canUse(await officeAccess(req), dwelling.building.office)) return res.status(404).json({ error: "Vivienda no encontrada" });
    if ((rest.status ?? "VIGENTE") === "VIGENTE" && (await prisma.lease.count({ where: { dwellingId, status: "VIGENTE" } })) > 0) {
      return res.status(409).json({ error: "Esta vivienda ya tiene un alquiler vigente. Finalízalo antes de crear otro." });
    }
    const lease = await prisma.lease.create({
      data: { ...rest, dwellingId, ownerId: rest.ownerId || null, tenantId: rest.tenantId || null, notes: rest.notes || null, startDate: day(rest.startDate), endDate: rest.endDate ? day(rest.endDate) : null },
      include: leaseInclude,
    });
    await syncDwellingStatus(dwellingId);
    await syncReminders(lease, dwellingLabel(dwelling), req.user!.userId);
    res.status(201).json(lease);
  }),
);

leasesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const current = await loadLease(req, id);
    if (!current) return res.status(404).json({ error: "Alquiler no encontrado" });
    const data = leaseInput.parse(req.body);
    if (data.status === "VIGENTE" && current.status !== "VIGENTE" && (await prisma.lease.count({ where: { dwellingId: current.dwellingId, status: "VIGENTE" } })) > 0) {
      return res.status(409).json({ error: "Esta vivienda ya tiene otro alquiler vigente" });
    }
    const lease = await prisma.lease.update({
      where: { id },
      data: { ...data, ownerId: data.ownerId || null, tenantId: data.tenantId || null, notes: data.notes || null, startDate: day(data.startDate), endDate: data.endDate ? day(data.endDate) : null },
      include: leaseInclude,
    });
    await syncDwellingStatus(lease.dwellingId);
    await syncReminders(lease, dwellingLabel(lease.dwelling), req.user!.userId);
    res.json(lease);
  }),
);

leasesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const lease = await loadLease(req, String(req.params.id));
    if (!lease) return res.status(404).json({ error: "Alquiler no encontrado" });
    await prisma.lease.delete({ where: { id: lease.id } });
    await syncDwellingStatus(lease.dwellingId);
    res.status(204).send();
  }),
);

// --- Documentos del alquiler ---

leasesRouter.post(
  "/:id/files",
  (req, res, next) =>
    uploadDwellingFile.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "El archivo supera los 10 MB" });
      next(err);
    }),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await loadLease(req, id))) return res.status(404).json({ error: "Alquiler no encontrado" });
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Sube un PDF, imagen, Word, Excel o texto de hasta 10 MB" });
    const name = Buffer.from(file.originalname, "latin1").toString("utf8").slice(0, 200);
    const saved = await prisma.leaseFile.create({
      data: { leaseId: id, name, mimeType: file.mimetype, size: file.size, data: new Uint8Array(file.buffer) },
      select: { id: true, name: true, mimeType: true, size: true, createdAt: true },
    });
    res.status(201).json(saved);
  }),
);

async function loadFileFor(req: Request, id: string) {
  const file = await prisma.leaseFile.findUnique({ where: { id }, include: { lease: { include: { dwelling: { include: { building: true } } } } } });
  if (!file || !canUse(await officeAccess(req), file.lease.dwelling.building.office)) return null;
  return file;
}

leasesRouter.get(
  "/files/:fid",
  asyncHandler(async (req, res) => {
    const file = await loadFileFor(req, String(req.params.fid));
    if (!file) return res.status(404).json({ error: "Archivo no encontrado" });
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.send(Buffer.from(file.data));
  }),
);

leasesRouter.delete(
  "/files/:fid",
  asyncHandler(async (req, res) => {
    const file = await loadFileFor(req, String(req.params.fid));
    if (!file) return res.status(404).json({ error: "Archivo no encontrado" });
    await prisma.leaseFile.delete({ where: { id: file.id } });
    res.status(204).send();
  }),
);

// --- Seguimiento: lo hecho y lo que hay que recordar ---

const activityInput = z.object({
  type: z.enum(["LLAMADA", "EMAIL", "WHATSAPP", "VISITA", "REUNION", "NOTA", "TAREA"]),
  description: z.string().trim().min(1).max(3000),
  dueDate: z.string().datetime().optional().nullable(),
  hasTime: z.boolean().optional(),
});

leasesRouter.get(
  "/:id/activities",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await loadLease(req, id))) return res.status(404).json({ error: "Alquiler no encontrado" });
    res.json(await prisma.activity.findMany({ where: { leaseId: id }, orderBy: { createdAt: "desc" }, take: 300, include: { agent: { select: { id: true, name: true } } } }));
  }),
);

leasesRouter.post(
  "/:id/activities",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const lease = await loadLease(req, id);
    if (!lease) return res.status(404).json({ error: "Alquiler no encontrado" });
    const data = activityInput.parse(req.body);
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;
    const activity = await prisma.activity.create({
      data: {
        type: data.type,
        description: data.description,
        dueDate,
        hasTime: Boolean(dueDate && data.hasTime),
        completed: !dueDate,
        leaseId: id,
        dwellingId: lease.dwellingId,
        agentId: req.user!.userId,
      },
      include: { agent: { select: { id: true, name: true } } },
    });
    res.status(201).json(activity);
  }),
);
