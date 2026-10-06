import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { safeUserSelect } from "../lib/linking.js";
import { dwellingActivityInclude, dwellingLabel } from "../lib/notifications.js";

export const activitiesRouter = Router();

const activityInput = z.object({
  type: z.enum(["LLAMADA", "EMAIL", "WHATSAPP", "VISITA", "REUNION", "NOTA", "TAREA"]),
  description: z.string().min(1),
  dueDate: z.string().datetime().optional().nullable(),
  hasTime: z.boolean().optional(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
});

activitiesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pending, mine } = req.query;
    const activities = await prisma.activity.findMany({
      where: {
        ...(pending === "true" ? { completed: false, dueDate: { not: null } } : {}),
        ...(mine === "true" ? { agentId: req.user!.userId } : {}),
        // Lo anotado en una vivienda solo lo ve su responsable (o un administrador); el diario completo está en la vivienda, con control de oficina.
        ...(req.user!.role === "ADMIN" ? {} : { OR: [{ dwellingId: null }, { agentId: req.user!.userId }] }),
      },
      orderBy: { dueDate: "asc" },
      include: { contact: true, deal: true, agent: { select: safeUserSelect }, dwelling: dwellingActivityInclude },
    });
    res.json(activities.map(({ dwelling, ...a }) => ({ ...a, dwelling: dwelling ? { id: dwelling.id, buildingId: dwelling.buildingId, label: dwellingLabel(dwelling) } : null })));
  }),
);

activitiesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = activityInput.parse(req.body);
    const activity = await prisma.activity.create({
      data: {
        ...data,
        agentId: data.agentId ?? req.user!.userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        hasTime: Boolean(data.dueDate && data.hasTime),
      },
    });
    res.status(201).json(activity);
  }),
);

/** Las tareas de una vivienda solo las toca su responsable o un administrador. */
async function ownsDwellingActivity(req: Request, id: string): Promise<boolean> {
  const existing = await prisma.activity.findUnique({ where: { id }, select: { dwellingId: true, agentId: true } });
  return !existing?.dwellingId || req.user!.role === "ADMIN" || existing.agentId === req.user!.userId;
}

activitiesRouter.patch(
  "/:id/complete",
  asyncHandler(async (req, res) => {
    if (!(await ownsDwellingActivity(req, String(req.params.id)))) return res.status(403).json({ error: "Esa tarea es de otra persona" });
    const activity = await prisma.activity.update({
      where: { id: String(req.params.id) },
      data: { completed: true },
    });
    res.json(activity);
  }),
);

activitiesRouter.patch(
  "/:id/assign",
  asyncHandler(async (req, res) => {
    const { agentId } = z.object({ agentId: z.string().nullable() }).parse(req.body);
    const activity = await prisma.activity.update({
      where: { id: String(req.params.id) },
      // Un cambio de responsable reinicia el aviso: el nuevo agente también debe recibirlo.
      data: { agentId, reminderSentAt: null },
    });
    res.json(activity);
  }),
);

activitiesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!(await ownsDwellingActivity(req, String(req.params.id)))) return res.status(403).json({ error: "Esa tarea es de otra persona" });
    await prisma.activity.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);
