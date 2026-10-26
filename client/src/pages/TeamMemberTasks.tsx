import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { TeamApi } from "../api/endpoints";
import { EmptyState } from "../components/EmptyState";
import { activityTypeLabels, formatDateTime, officeLabels } from "../lib/format";
import type { TeamMemberTask } from "../api/types";

type Tab = "overdue" | "pending" | "done";

const TABS: { key: Tab; label: string; chip: string }[] = [
  { key: "overdue", label: "Vencidas", chip: "bg-red-50 text-red-700" },
  { key: "pending", label: "Pendientes", chip: "bg-amber-50 text-amber-700" },
  { key: "done", label: "Realizadas", chip: "bg-emerald-50 text-emerald-700" },
];

const EMPTY: Record<Tab, string> = {
  overdue: "No tiene tareas vencidas.",
  pending: "No tiene tareas pendientes.",
  done: "Todavía no ha marcado ninguna tarea como realizada.",
};

function destination(t: TeamMemberTask) {
  if (t.leaseId) return `/alquileres/${t.leaseId}`;
  if (t.dwelling) return `/mapa?vivienda=${t.dwelling.id}`;
  if (t.contact) return `/contactos/${t.contact.id}`;
  return null;
}

/** Todas las tareas de una persona del equipo: vencidas, pendientes y realizadas. */
export function TeamMemberTasks() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<Tab>("overdue");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["team-member-tasks", id, tab, type, search, page],
    queryFn: () => TeamApi.tasksOf(id, { state: tab, type: type || undefined, q: search || undefined, page }),
    placeholderData: (previous) => previous,
  });

  function pick<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <Link to="/mi-equipo" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Equipo hoy
      </Link>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">{data ? data.user.name : "Tareas"}</h1>
        {data && <p className="text-sm text-slate-500">{data.user.office ? officeLabels[data.user.office] : "Sin oficina"}</p>}
      </div>
      <p className="mb-5 text-sm text-slate-500">Todas las tareas de esta persona. «Realizadas» muestra las que ha marcado como hechas, ordenadas por la fecha para la que estaban.</p>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => pick(setTab, t.key)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${tab === t.key ? "border-[#1c1815] bg-[#1c1815] text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}
          >
            {t.label}
            <span className={`rounded px-1.5 py-0.5 text-[11px] ${tab === t.key ? "bg-white/20 text-white" : t.chip}`}>{data ? data.counts[t.key] : "–"}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => pick(setSearch, e.target.value)} placeholder="Buscar en las tareas…" aria-label="Buscar en las tareas" className="w-64 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm" />
        </label>
        <select value={type} onChange={(e) => pick(setType, e.target.value)} aria-label="Tipo de tarea" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos los tipos</option>
          {Object.entries(activityTypeLabels).filter(([k]) => k !== "NOTA").map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : isError || !data ? (
        <EmptyState title="No se pudieron cargar las tareas" description="Puede que esa persona ya no esté en tu oficina." />
      ) : data.tasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{search || type ? "No hay tareas con esos filtros." : EMPTY[tab]}</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
          {data.tasks.map((t) => {
            const to = destination(t);
            const body = (
              <>
                <strong className="font-medium">{activityTypeLabels[t.type]}</strong> · {t.description}
              </>
            );
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${t.done ? "bg-emerald-50 text-emerald-700" : t.state === "overdue" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  {t.done ? "Realizada" : t.state === "overdue" ? "Vencida" : "Pendiente"}
                </span>
                <div className="min-w-0 flex-1 basis-56">
                  {to ? <Link to={to} className="hover:underline">{body}</Link> : <span>{body}</span>}
                  {(t.dwelling?.label || t.contact?.name) && <div className="text-xs text-slate-400">{t.dwelling?.label ?? t.contact?.name}</div>}
                </div>
                <span className="text-xs text-slate-500">{formatDateTime(t.dueDate, t.hasTime)}</span>
              </li>
            );
          })}
        </ul>
      )}

      {data && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Anterior</button>
          <span className="text-slate-500">Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">Siguiente</button>
        </div>
      )}
    </div>
  );
}
