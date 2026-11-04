import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, CalendarClock, Phone } from "lucide-react";
import { ActivitiesApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { activityTypeLabels } from "../lib/format";
import { useToast } from "./Toast";
import type { FollowupItem } from "../api/types";

const inputClass = "rounded-lg border border-slate-300 px-2 py-1.5 text-xs";
const btn = "flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

const FILTERS = [
  { value: "today", label: "Hoy y atrasadas" },
  { value: "week", label: "Próximos 7 días" },
  { value: "all", label: "Todas" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

/** Suma días a un día YYYY-MM-DD (sin zonas horarias: todo en UTC). */
function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const dayIso = (day: string) => new Date(`${day}T00:00:00Z`).toISOString();

function dayLabel(day: string, today: string): string {
  if (day < today) {
    const diff = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000);
    return diff === 1 ? "Ayer" : `Hace ${diff} días`;
  }
  if (day === today) return "Hoy";
  if (day === addDays(today, 1)) return "Mañana";
  return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${day}T00:00:00Z`));
}

/** Lista de trabajo del día: rellamadas y seguimientos sin hora, con contador, resultado de la llamada y reprogramación rápida. */
export function FollowupsBoard() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["followups"], queryFn: ActivitiesApi.followups, refetchInterval: 60_000 });
  const [filter, setFilter] = useState<Filter>("today");
  const [open, setOpen] = useState<{ id: string; mode: "result" | "move" } | null>(null);
  const [result, setResult] = useState({ note: "", next: "" });

  const refresh = () => {
    for (const key of ["followups", "notifications", "activities-pending", "calendar", "dwelling-activities", "lease-activities", "dashboard-summary"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
    queryClient.invalidateQueries({ queryKey: ["contact"] });
  };
  const onError = (error: unknown) => showToast(getErrorMessage(error, "No se pudo guardar"), "error");

  const complete = useMutation({
    mutationFn: ({ id, note, nextDate }: { id: string; note?: string; nextDate?: string }) => ActivitiesApi.completeWith(id, { note: note || null, nextDate: nextDate || null }),
    onSuccess: (_d, v) => {
      refresh();
      setOpen(null);
      setResult({ note: "", next: "" });
      showToast(v.nextDate ? "Hecha y siguiente seguimiento programado" : "Hecha");
    },
    onError,
  });
  const move = useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) => ActivitiesApi.reschedule(id, dueDate),
    onSuccess: () => {
      refresh();
      setOpen(null);
      showToast("Seguimiento reprogramado");
    },
    onError,
  });

  if (isLoading || !data) return <p className="text-slate-500">Cargando seguimientos…</p>;

  const { today, doneToday, items } = data;
  const due = items.filter((i) => i.day <= today);
  const visible = items.filter((i) => (filter === "all" ? true : filter === "week" ? i.day <= addDays(today, 7) : i.day <= today));
  const total = due.length + doneToday;
  const percent = total === 0 ? 0 : Math.round((doneToday / total) * 100);

  const pick = (item: FollowupItem, n: number) => move.mutate({ id: item.id, dueDate: dayIso(addDays(item.day < today ? today : item.day, n)) });

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
          <div>
            <p className="text-3xl font-semibold tabular-nums text-[#1c1815]">{due.length}</p>
            <p className="text-xs text-slate-500">pendientes hoy y atrasadas</p>
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums text-emerald-600">{doneToday}</p>
            <p className="text-xs text-slate-500">hechas hoy</p>
          </div>
          <div className="min-w-[160px] flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del día">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{total === 0 ? "Nada programado para hoy" : `${percent}% del día completado`}</p>
          </div>
        </div>
      </div>

      <div className="mb-3 inline-flex overflow-hidden rounded-lg border border-slate-300 text-xs">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" onClick={() => setFilter(f.value)} className={`px-3 py-1.5 ${filter === f.value ? "bg-[#1c1815] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          {filter === "today" ? "No tienes seguimientos pendientes para hoy. Programa los siguientes desde la ficha de un contacto o de una vivienda." : "No hay seguimientos en este periodo."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {visible.map((item) => {
            const late = item.day < today;
            const where = item.dwelling?.label ?? null;
            const dest = item.leaseId ? `/alquileres/${item.leaseId}` : item.dwelling ? `/mapa?vivienda=${item.dwelling.id}` : item.contact ? `/contactos/${item.contact.id}` : null;
            const busy = complete.isPending || move.isPending;
            return (
              <li key={item.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => complete.mutate({ id: item.id })}
                    disabled={busy}
                    aria-label="Marcar como hecha"
                    title="Hecha"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                  >
                    <Check size={15} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[#2a241f]">
                      <strong className="font-medium">{item.contact?.name ?? where ?? activityTypeLabels[item.type]}</strong>
                      <span className="text-slate-500"> · {activityTypeLabels[item.type]} · {item.description}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      <span className={late ? "font-medium text-red-600" : ""}>{dayLabel(item.day, today)}</span>
                      {where && item.contact && ` · ${where}`}
                      {dest && <> · <Link to={dest} className="hover:underline">Abrir ficha</Link></>}
                    </p>
                  </div>
                  {item.contact?.phone && (
                    <a href={`tel:${item.contact.phone}`} className={btn}>
                      <Phone size={13} /> {item.contact.phone}
                    </a>
                  )}
                  <button type="button" className={btn} onClick={() => setOpen(open?.id === item.id && open.mode === "result" ? null : { id: item.id, mode: "result" })}>
                    Resultado…
                  </button>
                  <button type="button" className={btn} onClick={() => setOpen(open?.id === item.id && open.mode === "move" ? null : { id: item.id, mode: "move" })}>
                    <CalendarClock size={13} /> Posponer
                  </button>
                </div>

                {open?.id === item.id && open.mode === "move" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
                    {!item.hasTime && (
                      <>
                        <button type="button" className={btn} disabled={busy} onClick={() => pick(item, 1)}>+1 día</button>
                        <button type="button" className={btn} disabled={busy} onClick={() => pick(item, 3)}>+3 días</button>
                        <button type="button" className={btn} disabled={busy} onClick={() => pick(item, 7)}>+1 semana</button>
                      </>
                    )}
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const value = String(new FormData(e.currentTarget).get("when") || "");
                        if (value) move.mutate({ id: item.id, dueDate: item.hasTime ? new Date(value).toISOString() : dayIso(value) });
                      }}
                    >
                      <input name="when" type={item.hasTime ? "datetime-local" : "date"} required aria-label="Elegir fecha" className={inputClass} />
                      <button type="submit" disabled={busy} className="rounded-lg bg-[#1c1815] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Guardar</button>
                    </form>
                  </div>
                )}

                {open?.id === item.id && open.mode === "result" && (
                  <form
                    className="mt-2 flex flex-col gap-2 pl-10"
                    onSubmit={(e) => {
                      e.preventDefault();
                      complete.mutate({ id: item.id, note: result.note.trim(), nextDate: result.next ? dayIso(result.next) : undefined });
                    }}
                  >
                    <input autoFocus value={result.note} onChange={(e) => setResult({ ...result, note: e.target.value })} maxLength={1000} placeholder="Cómo ha ido: no contesta, llamar el jueves…" aria-label="Resultado de la llamada" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">Siguiente seguimiento:</span>
                      {[{ l: "+1 día", n: 1 }, { l: "+3 días", n: 3 }, { l: "+1 semana", n: 7 }].map((o) => (
                        <button key={o.n} type="button" onClick={() => setResult({ ...result, next: result.next === addDays(today, o.n) ? "" : addDays(today, o.n) })} className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${result.next === addDays(today, o.n) ? "border-[#1c1815] bg-[#1c1815] text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                          {o.l}
                        </button>
                      ))}
                      <input type="date" value={result.next} min={today} onChange={(e) => setResult({ ...result, next: e.target.value })} aria-label="Fecha del siguiente seguimiento" className={inputClass} />
                      <button type="submit" disabled={busy} className="ml-auto rounded-lg bg-[#1c1815] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Hecha y guardar</button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
