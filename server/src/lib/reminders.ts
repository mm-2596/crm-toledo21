import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { rentalContactWhere } from "./contactScope.js";
import { BIRTHDAY_DEFAULT, templateFor } from "./greetings.js";
import { formatMadrid, madridDate, madridHour, taskDay } from "./madrid.js";
import { sendCampaignBatch, sendDigestEmail, sendReminderEmail, type AgendaLine } from "./email.js";
import { classify, dwellingActivityInclude, dwellingLabel, ownedBy } from "./notifications.js";

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
    include: { agent: { select: { email: true, active: true } }, contact: { select: { name: true } }, dwelling: dwellingActivityInclude },
  });

  for (const activity of due) {
    // Se "reclama" antes de enviar: aunque dos ciclos coincidan, el aviso sale una sola vez.
    const claimed = await prisma.activity.updateMany({ where: { id: activity.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (claimed.count === 0) continue;
    const to = await recipientsFor(activity.agent);
    await sendReminderEmail(
      to,
      { type: activity.type, description: activity.description, when: formatMadrid(activity.dueDate!, true), contactName: activity.contact?.name ?? (activity.dwelling ? dwellingLabel(activity.dwelling) : null) },
      crmUrl(activity.leaseId ? `/alquileres/${activity.leaseId}` : activity.dwellingId ? `/mapa?vivienda=${activity.dwellingId}` : activity.contactId ? `/contactos/${activity.contactId}` : "/tareas"),
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
      include: { contact: { select: { name: true } }, dwelling: dwellingActivityInclude },
    });

    const todayLines: AgendaLine[] = [];
    const overdueLines: AgendaLine[] = [];
    for (const a of activities) {
      const state = classify(a.dueDate!, a.hasTime, now);
      const line = { type: a.type, description: a.description, when: formatMadrid(a.dueDate!, a.hasTime), contactName: a.contact?.name ?? (a.dwelling ? dwellingLabel(a.dwelling) : null) };
      if (taskDay(a.dueDate!, a.hasTime) === today && state !== "overdue") todayLines.push(line);
      else if (state === "overdue") overdueLines.push(line);
    }
    const birthdays = await birthdayNamesFor(user.role, today);
    // Sin nada que contar no se manda correo: un resumen vacío solo molesta.
    if (todayLines.length === 0 && overdueLines.length === 0 && birthdays.length === 0) continue;
    await sendDigestEmail([user.email], user.name, todayLines, overdueLines, crmUrl(), birthdays);
  }
}

// --- Cumpleaños ---

const BIRTHDAY_FROM_HOUR = 9;
const BIRTHDAY_UNTIL_HOUR = 20;

/** Quién cumple hoy. El 29 de febrero se felicita el 28 en los años que no son bisiestos. */
function birthdayToday(today: string): Prisma.ContactWhereInput {
  const [y, m, d] = today.split("-").map(Number);
  const isLeap = new Date(Date.UTC(y, 1, 29)).getUTCMonth() === 1;
  const days = m === 2 && d === 28 && !isLeap ? [28, 29] : [d];
  return { birthMonth: m, birthDay: { in: days } };
}

function publicBaseUrl(): string {
  const raw = process.env.PUBLIC_BASE_URL || process.env.CLIENT_ORIGIN || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "");
  return raw.replace(/\/+$/, "");
}

/**
 * Felicita por email a quien cumple años hoy, solo si dio su consentimiento, tiene email y no se ha dado de baja.
 * Se reclama a cada persona antes de enviar, así que aunque el servidor se reinicie no se repite en el mismo año.
 * Con `dryRun` solo devuelve a quién se felicitaría.
 */
export async function sendBirthdayGreetings(now: Date, dryRun = false): Promise<string[]> {
  if (!dryRun && (madridHour(now) < BIRTHDAY_FROM_HOUR || madridHour(now) >= BIRTHDAY_UNTIL_HOUR)) return [];
  const template = await templateFor(BIRTHDAY_DEFAULT.key);
  if (!template.enabled) return [];

  const today = madridDate(now);
  const year = Number(today.slice(0, 4));
  const base = publicBaseUrl();
  if (!dryRun && !base) {
    console.warn("Cumpleaños: falta PUBLIC_BASE_URL/CLIENT_ORIGIN para el enlace de baja; no se envían felicitaciones.");
    return [];
  }

  const pending: Prisma.ContactWhereInput = { OR: [{ birthdayGreetedYear: null }, { birthdayGreetedYear: { not: year } }] };
  const where: Prisma.ContactWhereInput = {
    AND: [birthdayToday(today), pending, { marketingConsent: true }, { unsubscribedAt: null }, { email: { not: null } }, { NOT: { email: "" } }],
  };
  const people = await prisma.contact.findMany({ where, select: { id: true, name: true, email: true, unsubscribeToken: true } });
  if (dryRun) return people.map((p) => p.name);

  const greeted: string[] = [];
  for (const person of people) {
    const claimed = await prisma.contact.updateMany({ where: { AND: [{ id: person.id }, pending] }, data: { birthdayGreetedYear: year } });
    if (claimed.count === 0) continue;
    let token = person.unsubscribeToken;
    if (!token) {
      token = randomBytes(24).toString("hex");
      await prisma.contact.update({ where: { id: person.id }, data: { unsubscribeToken: token } });
    }
    const result = await sendCampaignBatch(
      { subject: template.subject, body: template.body, theme: BIRTHDAY_DEFAULT.theme },
      [{ to: person.email!, name: person.name, unsubscribeUrl: `${base}/api/public/unsubscribe?token=${token}` }],
    );
    if (result.ok) greeted.push(person.name);
    else console.error(`Cumpleaños: no se pudo felicitar a ${person.name}: ${result.error}`);
  }
  return greeted;
}

async function birthdayNamesFor(role: string, today: string): Promise<string[]> {
  const people = await prisma.contact.findMany({
    where: { AND: [birthdayToday(today), role === "ADMINISTRACION" ? rentalContactWhere() : {}] },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return people.map((p) => p.name);
}

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    await sendDueReminders(now);
    await sendMorningDigests(now);
    await sendBirthdayGreetings(now);
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
