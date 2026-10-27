import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { classify, dwellingLabel } from "../lib/notifications.js";
import { loadDwellingFor, officeAccess } from "./buildings.js";

export const prospectionsRouter = Router();

const PROSPECT_STATUSES = ["EN_SEGUIMIENTO", "CAPTADO", "DESCARTADO"] as const;
const SELL_INTERESTS = ["CORTO", "MEDIO", "LARGO", "NO_INTERESADO"] as const;

/** Pisos que la persona puede ver: los de las oficinas a las que tiene acceso. */
async function scope(req: Parameters<typeof officeAccess>[0]): Promise<Prisma.DwellingWhereInput | null> {
  const access = await officeAccess(req);
  if (access === null) return null;
  return access === "ALL" ? {} : { building: { office: access } };
}

/**
 * Pisos en prospección (los que intentamos captar), con su comercial, su interés en vender,
 * la última conversación y la próxima llamada pendiente.
 */
prospectionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const base = await scope(req);
    if (base === null) return res.json({ prospections: [] });

    const status = PROSPECT_STATUSES.find((s) => s === req.query.status);
    const interest = SELL_INTERESTS.find((s) => s === req.query.interest);
    const agentId = typeof req.query.agentId === "string" && req.query.agentId ? req.query.agentId : undefined;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const where: Prisma.DwellingWhereInput = {
      AND: [
        base,
        { prospectStatus: status ?? { not: null } },
        interest ? { sellInterest: interest } : {},
        agentId ? { agentId } : {},
        q
          ? {
              OR: [
                { building: { name: { contains: q, mode: "insensitive" } } },
                { building: { address: { contains: q, mode: "insensitive" } } },
                { notes: { contains: q, mode: "insensitive" } },
                { contact: { name: { contains: q, mode: "insensitive" } } },
                { residents: { some: { name: { contains: q, mode: "insensitive" } } } },
              ],
            }
          : {},
      ],
    };

    const rows = await prisma.dwelling.findMany({
      where,
      take: 500,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        buildingId: true,
        floor: true,
        door: true,
        prospectStatus: true,
        sellInterest: true,
        agent: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        residents: { where: { role: "PROPIETARIO" }, take: 1, select: { name: true, phone: true } },
        building: { select: { id: true, name: true, address: true, city: true, office: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 40,
          select: { id: true, type: true, description: true, dueDate: true, hasTime: true, completed: true, createdAt: true, agent: { select: { name: true } } },
        },
      },
    });

    const now = new Date();
    const prospections = rows.map((d) => {
      const logged = d.activities.find((a) => a.completed || !a.dueDate);
      const pending = d.activities
        .filter((a) => !a.completed && a.dueDate && a.type !== "NOTA")
        .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())[0];
      return {
        id: d.id,
        buildingId: d.buildingId,
        floor: d.floor,
        door: d.door,
        prospectStatus: d.prospectStatus,
        sellInterest: d.sellInterest,
        agent: d.agent,
        owner: d.contact?.name ?? d.residents[0]?.name ?? null,
        building: d.building,
        lastNote: logged ? { description: logged.description, createdAt: logged.createdAt.toISOString(), agent: logged.agent?.name ?? null } : null,
        nextCall: pending
          ? { id: pending.id, description: pending.description, dueDate: pending.dueDate!.toISOString(), hasTime: pending.hasTime, state: classify(pending.dueDate!, pending.hasTime, now) }
          : null,
      };
    });
    res.json({ prospections });
  }),
);

/**
 * Llamadas de seguimiento pendientes (hasta 90 días vista): las de los pisos en prospección y las de contactos
 * (p. ej. alguien que pidió una tasación). Cada comercial ve las suyas; un administrador puede ver las de todos
 * (?all=1) o las de una persona (?agentId=).
 */
prospectionsRouter.get(
  "/calls",
  asyncHandler(async (req, res) => {
    const base = await scope(req);
    if (base === null) return res.json({ calls: [] });
    const isAdmin = req.user!.role === "ADMIN";
    const agentId = isAdmin && typeof req.query.agentId === "string" && req.query.agentId ? req.query.agentId : undefined;
    const everyone = isAdmin && req.query.all === "1";
    const now = new Date();

    const activities = await prisma.activity.findMany({
      where: {
        completed: false,
        type: { not: "NOTA" },
        dueDate: { not: null, lte: new Date(now.getTime() + 90 * 86_400_000) },
        // Una llamada: de tipo llamada, o una tarea que empieza por "Llamar" (como las de tasación).
        AND: [
          { OR: [{ type: "LLAMADA" }, { description: { startsWith: "Llamar", mode: "insensitive" } }] },
          {
            OR: [
              { dwelling: { is: { AND: [base, { prospectStatus: { not: null } }] } } },
              { dwellingId: null, leaseId: null, contactId: { not: null } },
            ],
          },
        ],
        // Cada uno ve lo suyo; lo que no tiene responsable (p. ej. una tasación recién llegada) lo ven los administradores, como en Tareas.
        ...(everyone ? {} : agentId ? { agentId } : isAdmin ? { OR: [{ agentId: req.user!.userId }, { agentId: null }] } : { agentId: req.user!.userId }),
      },
      orderBy: { dueDate: "asc" },
      take: 300,
      include: {
        agent: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, phone: true } },
        dwelling: { select: { id: true, buildingId: true, floor: true, door: true, prospectStatus: true, sellInterest: true, building: { select: { name: true, address: true } }, residents: { where: { role: "PROPIETARIO" }, take: 1, select: { name: true, phone: true } } } },
      },
    });

    res.json({
      calls: activities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        dueDate: a.dueDate!.toISOString(),
        hasTime: a.hasTime,
        state: classify(a.dueDate!, a.hasTime, now),
        agent: a.agent,
        contact: a.contact ? { id: a.contact.id, name: a.contact.name, phone: a.contact.phone } : null,
        dwelling: a.dwelling
          ? {
              id: a.dwelling.id,
              buildingId: a.dwelling.buildingId,
              label: dwellingLabel(a.dwelling),
              address: a.dwelling.building.address,
              owner: a.dwelling.residents[0]?.name ?? null,
              phone: a.dwelling.residents[0]?.phone ?? null,
              sellInterest: a.dwelling.sellInterest,
            }
          : null,
      })),
    });
  }),
);

const quickNoteInput = z.object({
  note: z.string().trim().min(1).max(3000),
  /** Cuándo volver a llamar (opcional). */
  callAt: z.string().datetime().optional().nullable(),
  hasTime: z.boolean().optional(),
  callText: z.string().trim().min(1).max(300).optional(),
});

/**
 * Nota rápida de un piso: guarda lo hablado en su historial y, si hay fecha, crea el aviso para volver a llamar.
 * Si el piso aún no tenía ninguna captación en marcha, queda "en seguimiento" y con el comercial que anota.
 */
prospectionsRouter.post(
  "/dwellings/:id/quick-note",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const dwelling = await loadDwellingFor(req, id);
    if (!dwelling) return res.status(404).json({ error: "Vivienda no encontrada" });
    const data = quickNoteInput.parse(req.body);
    const userId = req.user!.userId;
    const callAt = data.callAt ? new Date(data.callAt) : null;

    const result = await prisma.$transaction(async (tx) => {
      const note = await tx.activity.create({
        data: { type: "NOTA", description: data.note, completed: true, dwellingId: id, agentId: userId },
        include: { agent: { select: { id: true, name: true } } },
      });
      const call = callAt
        ? await tx.activity.create({
            data: {
              type: "LLAMADA",
              description: data.callText ?? "Volver a llamar",
              dueDate: callAt,
              hasTime: Boolean(data.hasTime),
              dwellingId: id,
              agentId: userId,
            },
            include: { agent: { select: { id: true, name: true } } },
          })
        : null;
      // Si todavía no es una prospección ni una propiedad nuestra, empieza a serlo.
      if (!dwelling.prospectStatus && !dwelling.propertyId && dwelling.status === "CENSADA") {
        await tx.dwelling.update({ where: { id }, data: { prospectStatus: "EN_SEGUIMIENTO", agentId: dwelling.agentId ?? userId } });
      } else if (!dwelling.agentId && dwelling.prospectStatus) {
        await tx.dwelling.update({ where: { id }, data: { agentId: userId } });
      }
      return { note, call };
    });

    res.status(201).json(result);
  }),
);
