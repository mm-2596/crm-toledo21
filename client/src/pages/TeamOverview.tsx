import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { UsersRound } from "lucide-react";
import { ActivitiesApi, TeamApi, UsersApi } from "../api/endpoints";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { useAuth } from "../auth/AuthContext";
import { activityTypeLabels, formatDate, formatDateTime, officeLabels } from "../lib/format";
import type { Office, TeamTask } from "../api/types";

const STATE: Record<string, string> = {
  overdue: "bg-red-50 text-red-700",
  soon: "bg-amber-50 text-amber-700",
  today: "bg-emerald-50 text-emerald-700",
  upcoming: "bg-slate-100 text-slate-500",
};
const STATE_LABEL: Record<string, string> = { overdue: "Vencida", soon: "Ahora", today: "Hoy", upcoming: "Próxima" };

function destination(t: TeamTask) {
  if (t.leaseId) return `/alquileres/${t.leaseId}`;
  if (t.dwelling) return `/mapa?vivienda=${t.dwelling.id}`;
  if (t.contact) return `/contactos/${t.contact.id}`;
  return null;
}

/** Qué tiene que hacer hoy cada persona de la oficina y qué ha ido anotando; las tareas se pueden pasar a otra persona. */
export function TeamOverview() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [office, setOffice] = useState<Office | "">("");
  const [showUpcoming, setShowUpcoming] = useState(false);
  const canPickOffice = user?.role === "ADMIN" || !user?.office;

  const { data: users = [], isLoading } = useQuery({ queryKey: ["team-overview", office], queryFn: () => TeamApi.overview(office || undefined), refetchInterval: 60_000 });
  const { data: assignable = [] } = useQuery({ queryKey: ["assignable-users"], queryFn: UsersApi.assignable });
  const reassign = useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) => ActivitiesApi.assign(id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-overview"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showToast("Tarea reasignada");
    },
    onError: () => showToast("No se pudo reasignar la tarea", "error"),
  });

  function TaskRow({ t, owner }: { t: TeamTask; owner: string }) {
    const to = destination(t);
    return (
      <li className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-sm">
        {t.state && <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATE[t.state]}`}>{STATE_LABEL[t.state]}</span>}
        <div className="min-w-0 flex-1 basis-48">
          {to ? <Link to={to} className="hover:underline"><strong className="font-medium">{activityTypeLabels[t.type]}</strong> · {t.description}</Link> : <span><strong className="font-medium">{activityTypeLabels[t.type]}</strong> · {t.description}</span>}
          <div className="text-xs text-slate-500">
            {formatDateTime(t.dueDate, t.hasTime)}{(t.dwelling?.label || t.contact?.name) && ` · ${t.dwelling?.label ?? t.contact?.name}`}
          </div>
        </div>
        <select value={owner} onChange={(e) => reassign.mutate({ id: t.id, agentId: e.target.value })} aria-label="Reasignar a" className="rounded-lg border border-slate-300 px-1.5 py-1 text-xs text-slate-600">
          {assignable.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </li>
    );
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Equipo hoy</h1>
        <div className="flex items-center gap-3">
          {canPickOffice && (
            <select value={office} onChange={(e) => setOffice(e.target.value as Office | "")} aria-label="Oficina" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Todas las oficinas</option>
              {Object.entries(officeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showUpcoming} onChange={(e) => setShowUpcoming(e.target.checked)} /> Ver también los próximos 7 días
          </label>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-500">Lo que tiene que hacer hoy cada persona de la oficina y lo último que ha anotado. Puedes pasar una tarea a otra persona con el selector.</p>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : users.length === 0 ? (
        <EmptyState icon={UsersRound} title="No hay nadie en esta oficina" description="Asigna la oficina a cada agente en Equipo para verlos aquí." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {users.map((u) => {
            const open = [...u.overdue, ...u.today];
            return (
              <section key={u.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-medium text-[#1c1815]">{u.name}</h2>
                    <p className="text-xs text-slate-500">{u.office ? officeLabels[u.office] : "Sin oficina"}</p>
                  </div>
                  <div className="flex gap-2 text-xs font-medium">
                    {u.overdue.length > 0 && <span className="rounded bg-red-50 px-2 py-0.5 text-red-700">{u.overdue.length} atrasada{u.overdue.length === 1 ? "" : "s"}</span>}
                    <span className={`rounded px-2 py-0.5 ${u.today.length ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{u.today.length} hoy</span>
                  </div>
                </div>
                {open.length === 0 ? <p className="text-sm text-slate-400">Nada pendiente para hoy.</p> : <ul className="divide-y divide-slate-100">{open.map((t) => <TaskRow key={t.id} t={t} owner={u.id} />)}</ul>}
                {showUpcoming && u.upcoming.length > 0 && (
                  <>
                    <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Próximos días</h3>
                    <ul className="divide-y divide-slate-100">{u.upcoming.map((t) => <TaskRow key={t.id} t={t} owner={u.id} />)}</ul>
                  </>
                )}
                {u.recent.length > 0 && (
                  <>
                    <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Lo último que ha anotado</h3>
                    <ul className="mt-1 flex flex-col gap-1.5">
                      {u.recent.map((t) => (
                        <li key={t.id} className="text-xs text-slate-600">
                          <span className="text-slate-400">{formatDate(t.createdAt)} · {activityTypeLabels[t.type]}</span> — {t.description}
                          {(t.dwelling?.label || t.contact?.name) && <span className="text-slate-400"> ({t.dwelling?.label ?? t.contact?.name})</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
