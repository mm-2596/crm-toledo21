import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarApi } from "../api/endpoints";
import type { CalendarTask } from "../api/types";
import { activityTypeLabels } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parse = (s: string) => new Date(`${s}T00:00:00Z`);
const addDays = (s: string, n: number) => iso(new Date(parse(s).getTime() + n * 86_400_000));
const mondayOf = (s: string) => addDays(s, -((parse(s).getUTCDay() + 6) % 7));
const todayMadrid = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
const timeOf = (t: CalendarTask) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date(t.dueDate));

function destination(t: CalendarTask) {
  if (t.dwelling) return `/mapa?vivienda=${t.dwelling.id}`;
  if (t.contact) return `/contactos/${t.contact.id}`;
  return "/calendario";
}

/** Agenda de la página de inicio: solo las citas con hora fija de la persona (visitas, valoraciones, reuniones). Los seguimientos van aparte. */
export function HomeAgenda() {
  const { user } = useAuth();
  const today = todayMadrid();
  const [view, setView] = useState<"week" | "day">("week");
  const [cursor, setCursor] = useState(today);

  const from = view === "week" ? mondayOf(cursor) : cursor;
  const to = view === "week" ? addDays(from, 6) : cursor;
  const { data } = useQuery({ queryKey: ["calendar", from, to], queryFn: () => CalendarApi.range(from, to) });

  const appointments = (data?.tasks ?? []).filter((t) => t.hasTime && !t.completed && t.agentId === user?.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const days = Array.from({ length: view === "week" ? 7 : 1 }, (_, i) => addDays(from, i));
  const step = view === "week" ? 7 : 1;
  const start = parse(from);
  const end = parse(to);
  const title =
    view === "day"
      ? `${WEEKDAYS[(start.getUTCDay() + 6) % 7]} ${start.getUTCDate()} de ${MONTHS[start.getUTCMonth()]}`
      : `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()].slice(0, 3)} – ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()].slice(0, 3)}`;

  return (
    <section aria-label="Agenda" className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-medium text-[#1c1815]">
          <CalendarClock size={18} className="text-sky-600" /> Mi agenda <span className="text-sm font-normal text-slate-500">· {title}</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-xs">
            {(["week", "day"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={`px-2.5 py-1 ${view === v ? "bg-[#1c1815] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
                {v === "week" ? "Semana" : "Día"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setCursor(today)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">Hoy</button>
          <button type="button" aria-label="Anterior" onClick={() => setCursor(addDays(cursor, -step))} className="rounded-lg border border-slate-300 p-1 text-slate-600 hover:bg-slate-50"><ChevronLeft size={14} /></button>
          <button type="button" aria-label="Siguiente" onClick={() => setCursor(addDays(cursor, step))} className="rounded-lg border border-slate-300 p-1 text-slate-600 hover:bg-slate-50"><ChevronRight size={14} /></button>
          <Link to="/calendario" className="text-xs font-medium text-slate-500 hover:text-[#1c1815] hover:underline">Calendario completo</Link>
        </div>
      </div>
      <div className={`grid gap-2 border-t border-slate-100 p-3 ${view === "week" ? "md:grid-cols-7" : ""}`}>
        {days.map((day) => {
          const list = appointments.filter((t) => t.day === day);
          return (
            <div key={day} className={`rounded-lg border p-2 ${day === today ? "border-[#1c1815]" : "border-slate-200"}`}>
              <div className="mb-1.5 flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-slate-500">{WEEKDAYS[(parse(day).getUTCDay() + 6) % 7]}</span>
                <span className="text-sm font-semibold text-slate-700">{Number(day.slice(8))}</span>
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-slate-300">Sin citas</p>
              ) : (
                <ul className="space-y-1.5">
                  {list.map((t) => (
                    <li key={t.id}>
                      <Link to={destination(t)} className="block rounded bg-sky-50 px-2 py-1.5 text-xs text-sky-900 hover:bg-sky-100">
                        <span className="font-semibold">{timeOf(t)}</span> · {activityTypeLabels[t.type]}
                        <span className="block break-words">{t.description}</span>
                        {(t.dwelling?.label || t.contact?.name) && <span className="block truncate text-sky-700">{t.dwelling?.label ?? t.contact?.name}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
