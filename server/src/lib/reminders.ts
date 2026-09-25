import { prisma } from "./prisma.js";
import { formatMadrid, madridDate, madridHour, taskDay } from "./madrid.js";
import { sendDigestEmail, sendReminderEmail, type AgendaLine } from "./email.js";
import { classify, ownedBy } from "./notifications.js";

const REMIND_BEFORE_MS = 30 * 60 * 1000;
// Margen por si el servidor estuvo reiniciándose justo en el momento del aviso.
const LATE_GRACE_MS = 10 * 60 * 1000;
const DIGEST_FROM_HOUR = 8;
const DIGEST_UNTIL_HOUR = 21;

function crmUrl(path = "/tareas") {
  const base = (process.env.CLIENT_ORIGIN || "").replace(/\/+$/, "");
  return base ? `${base}${path}` : "";
}

async function recipientsFor(agent: { email: string; active: boolean } | null): Promise<string[]> {
  if (agent) return agent.active ? [agent.email] : [];
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true }, select: { email: true } });
  return admins.map((a) => a.email);
}

async function sendDueReminders(now: Date) {
  const due = await prisma.activity.findMany({
    where: {
      completed: false,
      hasTime: true,
      reminderSentAt: null,
      type: { not: "NOTA" },
      dueDate: { gte: new Date(now.getTime() - LATE_GRACE_MS), lte: new Date(now.getTime() + REMIND_BEFORE_MS) },
    },
    include: { agent: { select: { email: true, active: true } }, contact: { select: { name: true } } },
  });

  for (const activity of due) {
    // Se "reclama" antes de enviar: aunque dos ciclos coincidan, el aviso sale una sola vez.
    const claimed = await prisma.activity.updateMany({ where: { id: activity.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (claimed.count === 0) continue;
    const to = await recipientsFor(activity.agent);
    await sendReminderEmail(
      to,
      { type: activity.type, description: activity.description, when: formatMadrid(activity.dueDate!, true), contactName: activity.contact?.name },
      crmUrl(activity.contactId ? `/contactos/${activity.contactId}` : "/tareas"),
    );
  }
}

async function sendMorningDigests(now: Date) {
  const hour = madridHour(now);
  if (hour < DIGEST_FROM_HOUR || hour >= DIGEST_UNTIL_HOUR) return;
  const today = madridDate(now);

  const users = await prisma.user.findMany({
    where: { active: true, OR: [{ lastDigestOn: null }, { lastDigestOn: { not: today } }] },
    select: { id: true, name: true, email: true, role: true },
  });

  for (const user of users) {
    const claimed = await prisma.user.updateMany({
      where: { id: user.id, OR: [{ lastDigestOn: null }, { lastDigestOn: { not: today } }] },
      data: { lastDigestOn: today },
    });
    if (claimed.count === 0) continue;

    const activities = await prisma.activity.findMany({
      where: { AND: [ownedBy({ userId: user.id, role: user.role }), { completed: false, type: { not: "NOTA" }, dueDate: { not: null, lte: new Date(now.getTime() + 36 * 3600 * 1000) } }] },
      orderBy: { dueDate: "asc" },
      include: { contact: { select: { name: true } } },
    });

    const todayLines: AgendaLine[] = [];
    const overdueLines: AgendaLine[] = [];
    for (const a of activities) {
      const state = classify(a.dueDate!, a.hasTime, now);
      const line = { type: a.type, description: a.description, when: formatMadrid(a.dueDate!, a.hasTime), contactName: a.contact?.name };
      if (taskDay(a.dueDate!, a.hasTime) === today && state !== "overdue") todayLines.push(line);
      else if (state === "overdue") overdueLines.push(line);
    }
    // Sin nada que contar no se manda correo: un resumen vacío solo molesta.
    if (todayLines.length === 0 && overdueLines.length === 0) continue;
    await sendDigestEmail([user.email], user.name, todayLines, overdueLines, crmUrl());
  }
}

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    await sendDueReminders(now);
    await sendMorningDigests(now);
  } catch (err) {
    console.error("Error en el ciclo de recordatorios:", err);
  } finally {
    running = false;
  }
}

/**
 * Solo arranca en Railway (o con ENABLE_REMINDERS=true). En local el .env apunta
 * a la base de datos de producción, así que un `npm run dev` enviaría correos reales.
 */
export function startReminderScheduler() {
  const flag = process.env.ENABLE_REMINDERS;
  const enabled = flag === "true" || (flag !== "false" && Boolean(process.env.RAILWAY_ENVIRONMENT));
  if (!enabled) {
    console.log("Recordatorios a agentes desactivados (solo se activan en Railway o con ENABLE_REMINDERS=true).");
    return;
  }
  console.log("Recordatorios a agentes activados.");
  setInterval(() => void tick(), 60 * 1000);
  void tick();
}
