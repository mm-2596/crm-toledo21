import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import type { Office, Prisma } from "@prisma/client";
import multer from "multer";
import { propertyBriefSelect, syncDwellingFromProperty } from "../lib/linking.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const buildingsRouter = Router();
export const dwellingsRouter = Router();

const OFFICES = ["GETAFE", "LEGANES", "LAS_ROZAS", "PUERTO_SAGUNTO"] as const;
const STATUSES = ["CENSADA", "A_LA_VENTA", "VENDIDA", "ALQUILADA", "A_ALQUILER"] as const;
const STAGES = ["ENCARGO_VIGENTE", "RESERVADO", "ARRAS", "PENDIENTE_ESCRITURA", "FIRMADO_NOTARIO"] as const;
const ROLES = ["PROPIETARIO", "INQUILINO", "HIJO_PROPIETARIO", "FAMILIAR", "OTRO"] as const;

export const PROPERTY_TYPES = ["PISO", "CASA", "CHALET", "ATICO", "DUPLEX", "ESTUDIO", "LOCAL", "OFICINA", "GARAJE", "TERRENO", "NAVE_INDUSTRIAL", "TRASTERO", "OTRO"] as const;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);
export const uploadDwellingFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_FILE_TYPES.has(file.mimetype)),
});

/**
 * Hay datos personales de propietarios y vecinos: los administradores ven todas
 * las oficinas y cada agente solo la suya. Un agente necesita además el permiso que le da un administrador y una oficina asignada; si no, no ve
 * nada (mejor un aviso que enseñar datos de más). Se mira en la base de datos y
 * no en el token, para que un cambio de oficina surta efecto al instante.
 */
export async function officeAccess(req: Request): Promise<"ALL" | Office | null> {
  if (req.user!.role === "ADMIN") return "ALL";
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { office: true, active: true, canViewBuildings: true } });
  // Administración ve su oficina (o todas si no tiene una asignada) sin necesitar el permiso del mapa.
  if (req.user!.role === "ADMINISTRACION") return user?.active ? (user.office ?? "ALL") : null;
  return user?.active && user.canViewBuildings && user.office ? user.office : null;
}

export function canUse(access: "ALL" | Office | null, office: Office): boolean {
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
  saleStage: z.enum(STAGES).optional().nullable(),
  price: z.number().int().min(0).max(100_000_000).optional().nullable(),
  propertyType: z.enum(PROPERTY_TYPES).optional().nullable(),
  propertyId: z.string().optional().nullable(),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().int().min(0).max(50).optional().nullable(),
  areaM2: z.number().int().min(0).max(100_000).optional().nullable(),
});

const residentInput = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.enum(ROLES),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

/** El estado del mapa sigue a la fase de venta: poner una fase coge la vivienda a la venta y la firma ante notario la da por vendida. */
function applySaleStage<T extends { status?: (typeof STATUSES)[number]; saleStage?: (typeof STAGES)[number] | null }>(data: T, current?: { status: string; saleStage: string | null }) {
  const out: Record<string, unknown> = { ...data };
  if (data.saleStage === undefined) return out;
  if (data.saleStage !== (current?.saleStage ?? null)) out.saleStageAt = data.saleStage ? new Date() : null;
  if (data.saleStage === "FIRMADO_NOTARIO") out.status = "VENDIDA";
  else if (data.saleStage && (data.status ?? current?.status ?? "CENSADA") === "CENSADA") out.status = "A_LA_VENTA";
  return out;
}

const dwellingInclude = {
  property: { select: propertyBriefSelect },
  contact: { select: { id: true, name: true } },
  residents: { orderBy: { createdAt: "asc" as const } },
  leases: { select: { id: true, status: true, monthlyRent: true, endDate: true, tenant: { select: { name: true } } }, orderBy: { createdAt: "desc" as const } },
  files: { select: { id: true, name: true, mimeType: true, size: true, createdAt: true }, orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.DwellingInclude;

const withDwellings = {
  dwellings: {
    orderBy: [{ floor: "asc" as const }, { door: "asc" as const }],
    include: dwellingInclude,
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
                { dwellings: { some: { residents: { some: { name: { contains: q, mode: "insensitive" } } } } } },
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

/** Por qué no se puede vincular esa propiedad (o null si se puede). Una propiedad solo va con una vivienda. */
async function linkProblem(req: Request, propertyId: string, exceptDwellingId?: string): Promise<string | null> {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { listingType: true } });
  if (!property) return "Propiedad no encontrada";
  if (req.user!.role === "ADMINISTRACION" && property.listingType !== "ALQUILER") return "Tu perfil solo gestiona propiedades en alquiler";
  const other = await prisma.dwelling.findFirst({ where: { propertyId, ...(exceptDwellingId ? { id: { not: exceptDwellingId } } : {}) }, select: { id: true } });
  return other ? "Esa propiedad ya está vinculada a otra vivienda" : null;
}

export async function loadDwellingFor(req: Request, id: string) {
  const dwelling = await prisma.dwelling.findUnique({ where: { id }, include: { building: true } });
  if (!dwelling || !canUse(await officeAccess(req), dwelling.building.office)) return null;
  return dwelling;
}

// La vivienda del mapa que corresponde a una propiedad del catálogo (si hay y el usuario tiene acceso a su oficina).
dwellingsRouter.get(
  "/by-property/:pid",
  asyncHandler(async (req, res) => {
    const dwelling = await prisma.dwelling.findFirst({ where: { propertyId: String(req.params.pid) }, include: { ...dwellingInclude, building: true } });
    if (!dwelling) return res.json({ dwelling: null, hidden: false });
    if (!canUse(await officeAccess(req), dwelling.building.office)) return res.json({ dwelling: null, hidden: true });
    res.json({ dwelling, hidden: false });
  }),
);

dwellingsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { buildingId, ...rest } = z.object({ buildingId: z.string() }).merge(dwellingInput).parse(req.body);
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building || !canUse(await officeAccess(req), building.office)) return res.status(404).json({ error: "Edificio no encontrado" });
    if (rest.propertyId) {
      const problem = await linkProblem(req, rest.propertyId);
      if (problem) return res.status(409).json({ error: problem });
    }
    const dwelling = await prisma.dwelling.create({
      data: { ...applySaleStage(rest), propertyId: rest.propertyId || null, floor: rest.floor || null, door: rest.door || null, contactId: rest.contactId || null, notes: rest.notes || null, buildingId },
      include: dwellingInclude,
    });
    if (dwelling.propertyId) {
      await syncDwellingFromProperty(dwelling.propertyId);
      return res.status(201).json(await prisma.dwelling.findUnique({ where: { id: dwelling.id }, include: dwellingInclude }));
    }
    res.status(201).json(dwelling);
  }),
);

dwellingsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const current = await loadDwellingFor(req, id);
    if (!current) return res.status(404).json({ error: "Vivienda no encontrada" });
    const data = dwellingInput.parse(req.body);
    // Solo se tocan los campos que llegan: así cambiar el estado desde el mapa no borra el resto.
    const patch: Record<string, unknown> = applySaleStage(data, current);
    for (const key of ["floor", "door", "contactId", "notes"] as const) {
      if (data[key] !== undefined) patch[key] = data[key] || null;
    }
    // Estos números pueden valer 0 (p. ej. un estudio sin habitaciones): no se convierten en vacío.
    for (const key of ["price", "propertyType", "bedrooms", "bathrooms", "areaM2"] as const) {
      if (data[key] !== undefined) patch[key] = data[key];
    }
    if (data.propertyId !== undefined) {
      if (data.propertyId) {
        const problem = await linkProblem(req, data.propertyId, id);
        if (problem) return res.status(409).json({ error: problem });
      }
      patch.propertyId = data.propertyId || null;
    }
    let dwelling = await prisma.dwelling.update({ where: { id }, data: patch, include: dwellingInclude });
    if (data.propertyId) {
      await syncDwellingFromProperty(data.propertyId);
      dwelling = (await prisma.dwelling.findUnique({ where: { id }, include: dwellingInclude })) ?? dwelling;
    }
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

// --- Personas que viven en la vivienda ---

dwellingsRouter.post(
  "/:id/residents",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await loadDwellingFor(req, id))) return res.status(404).json({ error: "Vivienda no encontrada" });
    const data = residentInput.parse(req.body);
    const resident = await prisma.dwellingResident.create({
      data: { ...data, phone: data.phone || null, email: data.email || null, notes: data.notes || null, dwellingId: id },
    });
    res.status(201).json(resident);
  }),
);

async function loadResidentFor(req: Request, id: string) {
  const resident = await prisma.dwellingResident.findUnique({ where: { id }, include: { dwelling: { include: { building: true } } } });
  if (!resident || !canUse(await officeAccess(req), resident.dwelling.building.office)) return null;
  return resident;
}

dwellingsRouter.put(
  "/residents/:rid",
  asyncHandler(async (req, res) => {
    const rid = String(req.params.rid);
    if (!(await loadResidentFor(req, rid))) return res.status(404).json({ error: "Persona no encontrada" });
    const data = residentInput.parse(req.body);
    const resident = await prisma.dwellingResident.update({
      where: { id: rid },
      data: { ...data, phone: data.phone || null, email: data.email || null, notes: data.notes || null },
    });
    res.json(resident);
  }),
);

dwellingsRouter.delete(
  "/residents/:rid",
  asyncHandler(async (req, res) => {
    const rid = String(req.params.rid);
    if (!(await loadResidentFor(req, rid))) return res.status(404).json({ error: "Persona no encontrada" });
    await prisma.dwellingResident.delete({ where: { id: rid } });
    res.status(204).send();
  }),
);

// --- Archivos adjuntos ---

dwellingsRouter.post(
  "/:id/files",
  (req, res, next) =>
    uploadDwellingFile.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "El archivo supera los 10 MB" });
      }
      next(err);
    }),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await loadDwellingFor(req, id))) return res.status(404).json({ error: "Vivienda no encontrada" });
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Sube un PDF, imagen, Word, Excel o texto de hasta 10 MB" });
    // Los nombres con tildes llegan en latin1 desde multer.
    const name = Buffer.from(file.originalname, "latin1").toString("utf8").slice(0, 200);
    const saved = await prisma.dwellingFile.create({
      data: { dwellingId: id, name, mimeType: file.mimetype, size: file.size, data: new Uint8Array(file.buffer) },
      select: { id: true, name: true, mimeType: true, size: true, createdAt: true },
    });
    res.status(201).json(saved);
  }),
);

async function loadFileFor(req: Request, id: string) {
  const file = await prisma.dwellingFile.findUnique({ where: { id }, include: { dwelling: { include: { building: true } } } });
  if (!file || !canUse(await officeAccess(req), file.dwelling.building.office)) return null;
  return file;
}

dwellingsRouter.get(
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

dwellingsRouter.delete(
  "/files/:fid",
  asyncHandler(async (req, res) => {
    const file = await loadFileFor(req, String(req.params.fid));
    if (!file) return res.status(404).json({ error: "Archivo no encontrado" });
    await prisma.dwellingFile.delete({ where: { id: file.id } });
    res.status(204).send();
  }),
);

// --- Diario de la vivienda: lo hablado cada día y la siguiente acción programada ---

const ACTIVITY_TYPES = ["LLAMADA", "EMAIL", "WHATSAPP", "VISITA", "REUNION", "NOTA", "TAREA"] as const;
const dwellingActivityInput = z.object({
  type: z.enum(ACTIVITY_TYPES),
  description: z.string().trim().min(1).max(3000),
  dueDate: z.string().datetime().optional().nullable(),
  hasTime: z.boolean().optional(),
});

dwellingsRouter.get(
  "/:id/activities",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await loadDwellingFor(req, id))) return res.status(404).json({ error: "Vivienda no encontrada" });
    const activities = await prisma.activity.findMany({
      where: { dwellingId: id },
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { agent: { select: { id: true, name: true } } },
    });
    res.json(activities);
  }),
);

dwellingsRouter.post(
  "/:id/activities",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await loadDwellingFor(req, id))) return res.status(404).json({ error: "Vivienda no encontrada" });
    const data = dwellingActivityInput.parse(req.body);
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;
    // Lo anotado sin fecha es lo ya hablado o hecho; lo programado queda pendiente hasta completarlo.
    const isLogged = !dueDate;
    const activity = await prisma.activity.create({
      data: {
        type: data.type,
        description: data.description,
        dueDate,
        hasTime: Boolean(dueDate && data.hasTime),
        completed: isLogged,
        dwellingId: id,
        agentId: req.user!.userId,
      },
      include: { agent: { select: { id: true, name: true } } },
    });
    res.status(201).json(activity);
  }),
);
