import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { classify, dwellingActivityInclude, dwellingLabel } from "../lib/notifications.js";
import { taskDay } from "../lib/madrid.js";

export const calendarRouter = Router();

const query = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Tareas con fecha entre dos días (inclusive). El administrador ve las de todo el equipo;
 * el resto, solo las suyas.
 */
calendarRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { from, to } = query.parse(req.query);
    const isAdmin = req.user!.role === "ADMIN";
    const day = 86_400_000;
    const start = new Date(new Date(`${from}T00:00:00Z`).getTime() - day);
    const end = new Date(new Date(`${to}T00:00:00Z`).getTime() + 2 * day);
    const now = new Date();

    const rows = await prisma.activity.findMany({
      where: {
        type: { not: "NOTA" },
        dueDate: { gte: start, lt: end },
        ...(isAdmin ? {} : { agentId: req.user!.userId }),
      },
      orderBy: { dueDate: "asc" },
      take: 2000,
      include: {
        contact: { select: { id: true, name: true } },
        dwelling: dwellingActivityInclude,
      },
    });

    const tasks = rows
      .map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        dueDate: a.dueDate!.toISOString(),
        hasTime: a.hasTime,
        day: taskDay(a.dueDate!, a.hasTime),
        completed: a.completed,
        state: a.completed ? "done" : classify(a.dueDate!, a.hasTime, now),
        agentId: a.agentId,
        contact: a.contact,
        dwelling: a.dwelling ? { id: a.dwelling.id, buildingId: a.dwelling.buildingId, label: dwellingLabel(a.dwelling) } : null,
      }))
      .filter((t) => t.day >= from && t.day <= to);

    const users = await prisma.user.findMany({
      where: isAdmin ? { active: true } : { id: req.user!.userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, role: true },
    });

    res.json({ users, tasks });
  }),
);
