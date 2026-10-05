/** Días que faltan para el fin del contrato (negativo si ya pasó). Las fechas se guardan a medianoche UTC. */
export function daysUntil(endDate?: string | null): number | null {
  if (!endDate) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(endDate).getTime() - todayUtc) / 86_400_000);
}

export function endBadge(endDate?: string | null): { text: string; className: string } | null {
  const days = daysUntil(endDate);
  if (days == null) return null;
  if (days < 0) return { text: "Vencido", className: "bg-red-50 text-red-700" };
  if (days <= 30) return { text: `Termina en ${days} d`, className: "bg-red-50 text-red-700" };
  if (days <= 90) return { text: `Termina en ${days} d`, className: "bg-amber-50 text-amber-700" };
  return null;
}

export const isoDay = (value?: string | null) => (value ? value.slice(0, 10) : "");
