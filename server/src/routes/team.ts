import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { classify, dwellingActivityInclude, dwellingLabel } from "../lib/notifications.js";
import { officeAccess } from "./buildings.js";

export const teamRouter = Router();

const OFFICES = ["GETAFE", "LEGANES", "LAS_ROZAS", "PUERTO_SAGUNTO"] as const;

/**
 * Qué tiene que hacer hoy cada persona de la oficina y qué ha ido anotando.
 * Administración ve su oficina (o todas, si no tiene una asignada) y puede reasignar tareas desde Tareas.
 */
teamRouter.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const access = await officeAccess(req);
    if (access === null) return res.json({ users: [] });
    const requested = OFFICES.find((o) => o === req.query.office);
    const office = access === "ALL" ? requested : access;

    const users = await prisma.user.findMany({
      where: { active: true, role: { in: ["AGENT", "ADMINISTRACION"] }, ...(office ? { office } : {}) },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, office: true },
    });
    const ids = users.map((u) => u.id);
    const now = new Date();
    const include = { contact: { select: { id: true, name: true } }, dwelling: dwellingActivityInclude };
    const [pending, recent] = await Promise.all([
      prisma.activity.findMany({
        where: { agentId: { in: ids }, completed: false, type: { not: "NOTA" }, dueDate: { not: null, lte: new Date(now.getTime() + 7 * 86_400_000) } },
        orderBy: { dueDate: "asc" },
        take: 400,
        include,
      }),
      prisma.activity.findMany({
        where: { agentId: { in: ids }, completed: true, createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } },
        orderBy: { createdAt: "desc" },
        take: 300,
        include,
      }),
    ]);

    const shape = (a: (typeof pending)[number]) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      dueDate: a.dueDate?.toISOString() ?? null,
      hasTime: a.hasTime,
      createdAt: a.createdAt.toISOString(),
      state: a.dueDate ? classify(a.dueDate, a.hasTime, now) : null,
      contact: a.contact,
      leaseId: a.leaseId,
      dwelling: a.dwelling ? { id: a.dwelling.id, buildingId: a.dwelling.buildingId, label: dwellingLabel(a.dwelling) } : null,
    });

    res.json({
      users: users.map((u) => {
        const mine = pending.filter((a) => a.agentId === u.id).map(shape);
        return {
          ...u,
          overdue: mine.filter((a) => a.state === "overdue"),
          today: mine.filter((a) => a.state === "today" || a.state === "soon"),
          upcoming: mine.filter((a) => a.state === "upcoming"),
          recent: recent.filter((a) => a.agentId === u.id).slice(0, 8).map(shape),
        };
      }),
    });
  }),
);
