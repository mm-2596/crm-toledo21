// El servidor corre en UTC, pero el equipo trabaja en hora de Madrid: los "hoy",
// las 8:00 del resumen y las horas de los correos se calculan siempre aquí.
const TZ = "Europe/Madrid";

export function madridDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function madridHour(date: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(date)) % 24;
}

export function formatMadrid(date: Date, withTime: boolean): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: withTime ? TZ : "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

/** Las tareas sin hora se guardan a medianoche UTC del día elegido, así que su día es el de la fecha UTC. */
export function taskDay(dueDate: Date, hasTime: boolean): string {
  return hasTime ? madridDate(dueDate) : dueDate.toISOString().slice(0, 10);
}
