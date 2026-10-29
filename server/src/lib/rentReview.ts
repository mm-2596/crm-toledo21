import { prisma } from "./prisma.js";
import { dwellingLabel } from "./notifications.js";

/** Cuántos días antes de la revisión aparece la tarea en la agenda. */
const LEAD_DAYS = 30;
/** Desde cuántos días antes se crea la tarea (queda programada con su fecha de aviso). */
const CREATE_WITHIN_DAYS = 60;
const DAY = 86_400_000;

const utcToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

interface ReviewLease {
  status: string;
  startDate: Date;
  endDate: Date | null;
  nextRentReview: Date | null;
}

/** La fecha de la próxima actualización de la renta: la fijada a mano o, si no, el próximo aniversario del contrato. */
export function rentReviewDate(lease: ReviewLease): Date | null {
  if (lease.status !== "VIGENTE") return null;
  let review = lease.nextRentReview;
  if (!review) {
    const today = utcToday();
    let year = lease.startDate.getUTCFullYear() + 1;
    review = new Date(Date.UTC(year, lease.startDate.getUTCMonth(), lease.startDate.getUTCDate()));
    while (review < today) {
      year++;
      review = new Date(Date.UTC(year, lease.startDate.getUTCMonth(), lease.startDate.getUTCDate()));
    }
  }
  if (lease.endDate && review > lease.endDate) return null;
  return review;
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function withRentReview<T extends ReviewLease>(lease: T): T & { rentReviewDate: string | null } {
  const review = rentReviewDate(lease);
  return { ...lease, rentReviewDate: review ? isoDate(review) : null };
}

const kindFor = (review: Date) => `LEASE_RENT_REVIEW_${isoDate(review)}`;

/** Crea (una sola vez por contrato y año) la tarea de actualizar la renta cuando se acerca la fecha. */
export async function ensureRentReviewTasks() {
  const leases = await prisma.lease.findMany({
    where: { status: "VIGENTE" },
    include: { dwelling: { select: { id: true, agentId: true, floor: true, door: true, building: { select: { name: true } } } } },
  });
  const today = utcToday();
  for (const lease of leases) {
    const review = rentReviewDate(lease);
    if (!review || review.getTime() - today.getTime() > CREATE_WITHIN_DAYS * DAY) continue;
    const autoKind = kindFor(review);
    if (await prisma.activity.count({ where: { leaseId: lease.id, autoKind } })) continue;
    const due = new Date(Math.max(review.getTime() - LEAD_DAYS * DAY, today.getTime()));
    await prisma.activity.create({
      data: {
        type: "TAREA",
        description: `Actualizar la renta (IPC/IGRAF) de ${dwellingLabel(lease.dwelling)} antes del ${new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(review)}. Renta actual: ${new Intl.NumberFormat("es-ES").format(lease.monthlyRent)} €/mes.`,
        dueDate: due,
        hasTime: false,
        leaseId: lease.id,
        dwellingId: lease.dwellingId,
        autoKind,
        agentId: lease.dwelling.agentId,
      },
    });
  }
}
