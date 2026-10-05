import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { madridDate, taskDay } from "./madrid.js";

export type NotificationState = "overdue" | "soon" | "today" | "upcoming";

export interface NotificationItem {
  id: string;
  type: string;
  description: string;
  dueDate: string;
  hasTime: boolean;
  state: NotificationState;
  unassigned: boolean;
  contact: { id: string; name: string } | null;
  dwelling: { id: string; buildingId: string; label: string } | null;
}

/** «Edificio · Planta 2 · Puerta B», para saber de qué vivienda habla una tarea. */
export function dwellingLabel(d: { floor: string | null; door: string | null; building: { name: string } }): string {
  return [d.building.name, d.floor && `Planta ${d.floor}`, d.door && `Puerta ${d.door}`].filter(Boolean).join(" · ");
}

export const dwellingActivityInclude = {
  select: { id: true, buildingId: true, floor: true, door: true, building: { select: { name: true } } },
} as const;

const SOON_MS = 60 * 60 * 1000;

/** Cada agente ve lo suyo; lo que no tiene responsable lo ven los administradores hasta que alguien lo reasigne. */
export function ownedBy(user: { userId: string; role: string }): Prisma.ActivityWhereInput {
  return user.role === "ADMIN" ? { OR: [{ agentId: user.userId }, { agentId: null }] } : { agentId: user.userId };
}

export function classify(dueDate: Date, hasTime: boolean, now: Date): NotificationState {
  const today = madridDate(now);
  const day = taskDay(dueDate, hasTime);
  if (day < today) return "overdue";
  if (hasTime) {
    if (dueDate.getTime() < now.getTime()) return "overdue";
    if (dueDate.getTime() - now.getTime() <= SOON_MS) return "soon";
  }
  return day === today ? "today" : "upcoming";
}

export async function notificationsFor(user: { userId: string; role: string }, now = new Date()) {
  const horizon = new Date(now.getTime() + 36 * 60 * 60 * 1000);
  const activities = await prisma.activity.findMany({
    where: { AND: [ownedBy(user), { completed: false, type: { not: "NOTA" }, dueDate: { not: null, lte: horizon } }] },
    orderBy: { dueDate: "asc" },
    take: 60,
    include: { contact: { select: { id: true, name: true } }, dwelling: dwellingActivityInclude },
  });

  const items: NotificationItem[] = activities.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    dueDate: a.dueDate!.toISOString(),
    hasTime: a.hasTime,
    state: classify(a.dueDate!, a.hasTime, now),
    unassigned: a.agentId === null,
    contact: a.contact,
    dwelling: a.dwelling ? { id: a.dwelling.id, buildingId: a.dwelling.buildingId, label: dwellingLabel(a.dwelling) } : null,
  }));
  const count = items.filter((i) => i.state !== "upcoming").length;
  return { count, items };
}
