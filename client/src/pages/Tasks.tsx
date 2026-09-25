import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckSquare } from "lucide-react";
import { ActivitiesApi, UsersApi } from "../api/endpoints";
import { activityTypeLabels, formatDateTime } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

export function Tasks() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [onlyMine, setOnlyMine] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["activities-pending", onlyMine],
    queryFn: () => ActivitiesApi.list(true, onlyMine),
  });
  const { data: agents } = useQuery({ queryKey: ["assignable-users"], queryFn: UsersApi.assignable });

  const assignMutation = useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string | null }) => ActivitiesApi.assign(id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities-pending"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showToast("Responsable actualizado");
    },
  });

  const completeMutation = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities-pending"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showToast("Tarea completada");
    },
  });

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Tareas pendientes</h1>
        <div className="flex overflow-hidden rounded-lg border border-slate-300 text-sm">
          {[
            { value: true, label: "Mis tareas" },
            { value: false, label: "Todas" },
          ].map((option) => (
            <button
              key={option.label}
              onClick={() => setOnlyMine(option.value)}
              className={`px-3 py-1.5 font-medium ${onlyMine === option.value ? "bg-[#1c1815] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Llamadas, visitas y reuniones con fecha. Se añaden desde la ficha de cada contacto; con hora, el responsable recibe un aviso.
      </p>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No hay tareas pendientes"
          description="¡Buen trabajo! Cuando añadas una tarea con fecha desde la ficha de un contacto, aparecerá aquí."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((activity) => (
                <tr key={activity.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(activity.dueDate, activity.hasTime)}</td>
                  <td className="px-4 py-3 text-slate-600">{activityTypeLabels[activity.type]}</td>
                  <td className="px-4 py-3 text-[#2a241f]">{activity.description}</td>
                  <td className="px-4 py-3">
                    {activity.contact ? (
                      <Link to={`/contactos/${activity.contact.id}`} className="text-[#2a241f] hover:underline">
                        {activity.contact.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={activity.agentId ?? ""}
                      onChange={(e) => assignMutation.mutate({ id: activity.id, agentId: e.target.value || null })}
                      aria-label="Responsable"
                      className={`rounded-lg border px-2 py-1 text-xs ${activity.agentId ? "border-slate-300 text-slate-700" : "border-amber-300 bg-amber-50 text-amber-800"}`}
                    >
                      <option value="">Sin asignar</option>
                      {(agents ?? []).map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => completeMutation.mutate(activity.id)}
                      className="text-xs font-medium text-[#2a241f] hover:underline"
                    >
                      Completar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
