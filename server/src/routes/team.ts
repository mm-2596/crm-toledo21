import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { classify, dwellingActivityInclude, dwellingLabel } from "../lib/notifications.js";
import { officeAccess } from "./buildings.js";

export const teamRouter = Router();

const OFFICES = ["GETAFE", "LEGANES", "LAS_ROZAS", "PUERTO_SAGUNTO"] as const;

// Una "tarea" es cualquier anotación con fecha que no sea una nota suelta.
const TASK_WHERE = { type: { not: "NOTA" as const }, dueDate: { not: null } };

type TaskState = "overdue" | "pending" | "done";

function taskState(a: { completed: boolean; dueDate: Date | null; hasTime: boolean }, now: Date): TaskState {
  if (a.completed) return "done";
  return a.dueDate && classify(a.dueDate, a.hasTime, now) === "overdue" ? "overdue" : "pending";
}

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

    const everything = await prisma.activity.findMany({
      where: { agentId: { in: ids }, ...TASK_WHERE },
      select: { agentId: true, completed: true, dueDate: true, hasTime: true },
    });
    const countsFor = (id: string) => {
      const counts = { overdue: 0, pending: 0, done: 0 };
      for (const a of everything) if (a.agentId === id) counts[taskState(a, now)]++;
      return counts;
    };

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
          counts: countsFor(u.id),
          overdue: mine.filter((a) => a.state === "overdue"),
          today: mine.filter((a) => a.state === "today" || a.state === "soon"),
          upcoming: mine.filter((a) => a.state === "upcoming"),
          recent: recent.filter((a) => a.agentId === u.id).slice(0, 8).map(shape),
        };
      }),
    });
  }),
);

/**
 * Todas las tareas de una persona: vencidas, pendientes y realizadas.
 * Cada oficina solo ve a su gente; quien no tiene oficina asignada (o es administrador) ve a todos.
 */
teamRouter.get(
  "/:userId/tasks",
  asyncHandler(async (req, res) => {
    const access = await officeAccess(req);
    if (access === null) return res.status(403).json({ error: "Sin acceso" });

    const member = await prisma.user.findFirst({
      where: { id: String(req.params.userId), active: true, ...(access === "ALL" ? {} : { office: access }) },
      select: { id: true, name: true, role: true, office: true },
    });
    if (!member) return res.status(404).json({ error: "Persona no encontrada" });

    const wanted = ["overdue", "pending", "done"].includes(String(req.query.state)) ? (String(req.query.state) as TaskState) : null;
    const type = typeof req.query.type === "string" && req.query.type !== "NOTA" ? req.query.type : null;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = 25;
    const now = new Date();

    const rows = await prisma.activity.findMany({
      where: {
        agentId: member.id,
        ...TASK_WHERE,
        ...(type ? { type: type as never } : {}),
        ...(q ? { description: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: { dueDate: "desc" },
      take: 2000,
      include: { contact: { select: { id: true, name: true } }, dwelling: dwellingActivityInclude },
    });

    const counts = { overdue: 0, pending: 0, done: 0 };
    const withState = rows.map((a) => {
      const state = taskState(a, now);
      counts[state]++;
      return { a, state };
    });
    // Lo atrasado y lo pendiente se ordena por la fecha más próxima; lo realizado, por lo más reciente.
    const filtered = withState.filter((x) => !wanted || x.state === wanted);
    if (wanted !== "done") filtered.sort((x, y) => (x.state === "done" ? 1 : 0) - (y.state === "done" ? 1 : 0) || x.a.dueDate!.getTime() - y.a.dueDate!.getTime());

    const tasks = filtered.slice((page - 1) * pageSize, page * pageSize).map(({ a, state }) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      dueDate: a.dueDate!.toISOString(),
      hasTime: a.hasTime,
      createdAt: a.createdAt.toISOString(),
      state: state === "done" ? null : (classify(a.dueDate!, a.hasTime, now) as string),
      done: state === "done",
      contact: a.contact,
      leaseId: a.leaseId,
      dwelling: a.dwelling ? { id: a.dwelling.id, buildingId: a.dwelling.buildingId, label: dwellingLabel(a.dwelling) } : null,
    }));

    res.json({ user: member, counts, total: filtered.length, page, pageSize, tasks });
  }),
);
