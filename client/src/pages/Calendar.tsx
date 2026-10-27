import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarRange, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ActivitiesApi, CalendarApi } from "../api/endpoints";
import type { CalendarTask } from "../api/types";
import { activityTypeLabels } from "../lib/format";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";

// Cada persona tiene su color; Álvaro siempre es el azul.
const BLUE = "#2563eb";
const PALETTE = ["#16a34a", "#ea580c", "#9333ea", "#db2777", "#0d9488", "#ca8a04", "#dc2626", "#0891b2"];
const UNASSIGNED = "#64748b";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parse = (s: string) => new Date(`${s}T00:00:00Z`);
const addDays = (s: string, n: number) => iso(new Date(parse(s).getTime() + n * 86_400_000));
const mondayOf = (s: string) => addDays(s, -((parse(s).getUTCDay() + 6) % 7));
const todayMadrid = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());

function timeOf(t: CalendarTask) {
  return t.hasTime ? new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date(t.dueDate)) : "";
}

export function Calendar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const today = todayMadrid();
  const [view, setView] = useState<"month" | "day">("month");
  const [cursor, setCursor] = useState(today);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const monthStart = `${cursor.slice(0, 8)}01`;
  const gridStart = mondayOf(monthStart);
  const gridEnd = addDays(gridStart, 41);

  const { data, isLoading } = useQuery({
    queryKey: ["calendar", gridStart, gridEnd],
    queryFn: () => CalendarApi.range(gridStart, gridEnd),
  });

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    let i = 0;
    for (const u of data?.users ?? []) {
      if (/^[aá]lvaro/i.test(u.name) || !isAdmin) map.set(u.id, BLUE);
      else map.set(u.id, PALETTE[i++ % PALETTE.length]);
    }
    return map;
  }, [data?.users, isAdmin]);
  const colorOf = (id: string | null) => (id ? colors.get(id) ?? UNASSIGNED : UNASSIGNED);
  const nameOf = (id: string | null) => data?.users.find((u) => u.id === id)?.name ?? "Sin asignar";

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const t of data?.tasks ?? []) {
      if (t.agentId && hidden.has(t.agentId)) continue;
      const list = map.get(t.day) ?? [];
      list.push(t);
      map.set(t.day, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return map;
  }, [data?.tasks, hidden]);

  const completeMutation = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["activities-pending"] });
      showToast("Tarea completada");
    },
  });

  function move(dir: -1 | 1) {
    if (view === "day") return setCursor(addDays(cursor, dir));
    const d = parse(monthStart);
    d.setUTCMonth(d.getUTCMonth() + dir);
    setCursor(iso(d));
  }

  const cursorDate = parse(cursor);
  const title =
    view === "month"
      ? `${MONTHS[cursorDate.getUTCMonth()]} de ${cursorDate.getUTCFullYear()}`
      : `${WEEKDAYS[(cursorDate.getUTCDay() + 6) % 7]} ${cursorDate.getUTCDate()} de ${MONTHS[cursorDate.getUTCMonth()]} de ${cursorDate.getUTCFullYear()}`;

  const dayTasks = byDay.get(cursor) ?? [];
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-[#2a241f]">
            <CalendarRange size={22} /> Calendario
          </h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? "Las tareas de todo el equipo, cada persona con su color." : "Tus tareas, día a día."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white text-sm">
            {(["month", "day"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1.5 ${view === v ? "bg-[#1c1815] text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {v === "month" ? "Mes" : "Día"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setCursor(today)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            Hoy
          </button>
          <div className="inline-flex items-center gap-1">
            <button type="button" aria-label="Anterior" onClick={() => move(-1)} className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50">
              <ChevronLeft size={16} />
            </button>
            <button type="button" aria-label="Siguiente" onClick={() => move(1)} className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#2a241f] first-letter:uppercase">{title}</h2>
        {isAdmin && (data?.users.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {data!.users.map((u) => {
              const off = hidden.has(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() =>
                    setHidden((prev) => {
                      const next = new Set(prev);
                      if (next.has(u.id)) next.delete(u.id);
                      else next.add(u.id);
                      return next;
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${off ? "border-slate-200 text-slate-400 line-through" : "border-slate-300 text-slate-700"} bg-white`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: off ? "#cbd5e1" : colorOf(u.id) }} />
                  {u.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : view === "month" ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-500">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day) => {
              const inMonth = day.slice(0, 7) === cursor.slice(0, 7);
              const list = byDay.get(day) ?? [];
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setCursor(day);
                    setView("day");
                  }}
                  className={`min-h-[64px] border-b border-r border-slate-100 p-1 text-left align-top hover:bg-slate-50 sm:min-h-[104px] ${inMonth ? "" : "bg-slate-50/60"}`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${day === today ? "bg-[#1c1815] font-semibold text-white" : inMonth ? "text-slate-700" : "text-slate-300"}`}
                  >
                    {Number(day.slice(8))}
                  </span>
                  <div className="mt-1 hidden space-y-0.5 sm:block">
                    {list.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className={`truncate rounded px-1.5 py-0.5 text-[11px] leading-tight text-white ${t.completed ? "opacity-50 line-through" : ""}`}
                        style={{ background: colorOf(t.agentId) }}
                        title={`${nameOf(t.agentId)} · ${t.description}`}
                      >
                        {timeOf(t) && `${timeOf(t)} `}
                        {t.description}
                      </div>
                    ))}
                    {list.length > 3 && <div className="px-1 text-[11px] text-slate-500">+{list.length - 3} más</div>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                    {list.slice(0, 6).map((t) => (
                      <span key={t.id} className="h-2 w-2 rounded-full" style={{ background: colorOf(t.agentId) }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : dayTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No hay tareas este día.
        </div>
      ) : (
        <ul className="space-y-2">
          {dayTasks.map((t) => (
            <li key={t.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3" style={{ borderLeft: `4px solid ${colorOf(t.agentId)}` }}>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${t.completed ? "text-slate-400 line-through" : "text-[#2a241f]"}`}>{t.description}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {timeOf(t) || "Todo el día"} · {activityTypeLabels[t.type] ?? t.type}
                  {isAdmin && (
                    <>
                      {" · "}
                      <span className="font-medium" style={{ color: colorOf(t.agentId) }}>
                        {nameOf(t.agentId)}
                      </span>
                    </>
                  )}
                  {t.state === "overdue" && <span className="ml-2 text-red-600">Vencida</span>}
                </p>
                {(t.contact || t.dwelling) && (
                  <p className="mt-0.5 text-xs">
                    {t.contact && (
                      <Link to={`/contactos/${t.contact.id}`} className="text-[#2a241f] hover:underline">
                        {t.contact.name}
                      </Link>
                    )}
                    {t.contact && t.dwelling && " · "}
                    {t.dwelling && (
                      <Link to={`/mapa?vivienda=${t.dwelling.id}`} className="text-[#2a241f] hover:underline">
                        {t.dwelling.label}
                      </Link>
                    )}
                  </p>
                )}
              </div>
              {!t.completed && (
                <button
                  type="button"
                  onClick={() => completeMutation.mutate(t.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Check size={14} /> Completar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
