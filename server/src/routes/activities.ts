import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

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
      },
      orderBy: { dueDate: "asc" },
      include: { contact: true, deal: true, agent: true },
    });
    res.json(activities);
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

activitiesRouter.patch(
  "/:id/complete",
  asyncHandler(async (req, res) => {
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
    await prisma.activity.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);
