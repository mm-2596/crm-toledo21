import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarCheck, Check } from "lucide-react";
import { ActivitiesApi, NotificationsApi } from "../api/endpoints";
import { activityTypeLabels, formatDateTime } from "../lib/format";
import { useToast } from "./Toast";
import type { NotificationItem } from "../api/types";

const STATE_STYLES = {
  overdue: { label: "Vencida", className: "bg-red-50 text-red-700" },
  soon: { label: "Ahora", className: "bg-amber-50 text-amber-700" },
  today: { label: "Hoy", className: "bg-emerald-50 text-emerald-700" },
  upcoming: { label: "Próxima", className: "bg-slate-100 text-slate-500" },
} as const;

function destination(item: NotificationItem) {
  if (item.leaseId) return `/alquileres/${item.leaseId}`;
  if (item.dwelling) return `/mapa?vivienda=${item.dwelling.id}`;
  if (item.contact) return `/contactos/${item.contact.id}`;
  return "/tareas";
}

/** Barra de la página de inicio: lo que cada persona tiene que hacer hoy (y lo que se le quedó atrás). */
export function TodayTasks() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: NotificationsApi.list, refetchInterval: 60_000 });
  const complete = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["activities-pending"] });
      queryClient.invalidateQueries({ queryKey: ["dwelling-activities"] });
      queryClient.invalidateQueries({ queryKey: ["lease-activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      showToast("Tarea hecha");
    },
  });

  const items = (data?.items ?? []).filter((i) => i.state !== "upcoming");
  const overdue = items.filter((i) => i.state === "overdue").length;
  const heading =
    items.length === 0
      ? "Hoy no tienes tareas programadas"
      : `Hoy tienes ${items.length} ${items.length === 1 ? "tarea" : "tareas"}${overdue ? ` (${overdue} atrasada${overdue === 1 ? "" : "s"})` : ""}`;

  return (
    <section aria-label="Tareas de hoy" className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-medium text-[#1c1815]">
          <CalendarCheck size={18} className={items.length ? "text-amber-600" : "text-emerald-600"} /> {heading}
        </h2>
        <Link to="/tareas" className="shrink-0 text-xs font-medium text-slate-500 hover:text-[#1c1815] hover:underline">Ver todas</Link>
      </div>
      {items.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${STATE_STYLES[item.state].className}`}>{STATE_STYLES[item.state].label}</span>
              <Link to={destination(item)} className="min-w-0 flex-1 hover:underline">
                <span className="block truncate text-sm text-[#2a241f]">
                  <strong className="font-medium">{activityTypeLabels[item.type]}</strong> · {item.description}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {formatDateTime(item.dueDate, item.hasTime)}
                  {(item.dwelling?.label || item.contact?.name) && ` · ${item.dwelling?.label ?? item.contact?.name}`}
                </span>
              </Link>
              <button
                onClick={() => complete.mutate(item.id)}
                disabled={complete.isPending}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Check size={13} /> Hecha
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
