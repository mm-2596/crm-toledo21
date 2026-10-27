import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarRange, Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ActivitiesApi, CalendarApi, UsersApi } from "../api/endpoints";
import type { ActivityType, CalendarTask } from "../api/types";
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
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(today);
  const [creating, setCreating] = useState(false);
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

  const { data: assignable } = useQuery({ queryKey: ["assignable-users"], queryFn: UsersApi.assignable, enabled: isAdmin });
  const createMutation = useMutation({
    mutationFn: ActivitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["activities-pending"] });
      setCreating(false);
      showToast("Tarea creada");
    },
    onError: () => showToast("No se pudo crear la tarea"),
  });

  function submitTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const date = String(form.get("date") || "");
    const time = String(form.get("time") || "");
    if (!date) return;
    createMutation.mutate({
      type: String(form.get("type")) as ActivityType,
      description: String(form.get("description")).trim(),
      dueDate: time ? new Date(`${date}T${time}`).toISOString() : new Date(`${date}T12:00:00Z`).toISOString(),
      hasTime: Boolean(time),
      agentId: isAdmin ? String(form.get("agentId") || "") || undefined : undefined,
    });
  }

  function move(dir: -1 | 1) {
    if (view === "day") return setCursor(addDays(cursor, dir));
    if (view === "week") return setCursor(addDays(cursor, dir * 7));
    const d = parse(monthStart);
    d.setUTCMonth(d.getUTCMonth() + dir);
    setCursor(iso(d));
  }

  const cursorDate = parse(cursor);
  const weekStart = mondayOf(cursor);
  const weekEnd = parse(addDays(weekStart, 6));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const title =
    view === "month"
      ? `${MONTHS[cursorDate.getUTCMonth()]} de ${cursorDate.getUTCFullYear()}`
      : view === "week"
        ? `Semana del ${parse(weekStart).getUTCDate()} de ${MONTHS[parse(weekStart).getUTCMonth()]} al ${weekEnd.getUTCDate()} de ${MONTHS[weekEnd.getUTCMonth()]} de ${weekEnd.getUTCFullYear()}`
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
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1.5 ${view === v ? "bg-[#1c1815] text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#1c1815] px-3 py-1.5 text-sm text-white hover:bg-[#2a241f]"
          >
            <Plus size={14} /> Nueva tarea
          </button>
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

      {creating && (
        <form key={cursor} onSubmit={submitTask} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-6">
          <select id="task-type" name="type" defaultValue="TAREA" aria-label="Tipo" className="rounded-lg border border-slate-300 px-2 py-2 text-sm sm:col-span-2">
            {Object.entries(activityTypeLabels)
              .filter(([k]) => k !== "NOTA")
              .map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
          </select>
          <input id="task-description" name="description" required placeholder="¿Qué hay que hacer?" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-4" />
          <input id="task-date" name="date" type="date" required defaultValue={cursor} aria-label="Día" className="rounded-lg border border-slate-300 px-2 py-2 text-sm sm:col-span-2" />
          <input id="task-time" name="time" type="time" aria-label="Hora (opcional)" className="rounded-lg border border-slate-300 px-2 py-2 text-sm sm:col-span-2" />
          {isAdmin ? (
            <select id="task-agent" name="agentId" defaultValue={user?.id} aria-label="Responsable" className="rounded-lg border border-slate-300 px-2 py-2 text-sm sm:col-span-2">
              {assignable?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="sm:col-span-2" />
          )}
          <div className="flex gap-2 sm:col-span-6">
            <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-[#1c1815] px-4 py-2 text-sm text-white disabled:opacity-60">
              Crear tarea
            </button>
            <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">
              Cancelar
            </button>
          </div>
        </form>
      )}

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
      ) : view === "week" ? (
        <div className="grid gap-2 md:grid-cols-7">
          {weekDays.map((day, i) => {
            const list = byDay.get(day) ?? [];
            return (
              <div key={day} className={`rounded-lg border bg-white p-2 ${day === today ? "border-[#1c1815]" : "border-slate-200"}`}>
                <button
                  type="button"
                  onClick={() => {
                    setCursor(day);
                    setView("day");
                  }}
                  className="mb-2 flex w-full items-baseline gap-1.5 text-left"
                >
                  <span className="text-xs font-medium text-slate-500">{WEEKDAYS[i]}</span>
                  <span className={`text-sm font-semibold ${day === today ? "text-[#1c1815]" : "text-slate-700"}`}>{Number(day.slice(8))}</span>
                </button>
                <div className="space-y-1.5">
                  {list.length === 0 && <p className="text-xs text-slate-300">—</p>}
                  {list.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded px-2 py-1.5 text-xs text-white ${t.completed ? "opacity-50" : ""}`}
                      style={{ background: colorOf(t.agentId) }}
                      title={`${nameOf(t.agentId)} · ${t.description}`}
                    >
                      <p className={`break-words font-medium leading-snug ${t.completed ? "line-through" : ""}`}>{t.description}</p>
                      <p className="mt-0.5 opacity-90">
                        {timeOf(t) || "Todo el día"}
                        {isAdmin && ` · ${nameOf(t.agentId).split(" ")[0]}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
