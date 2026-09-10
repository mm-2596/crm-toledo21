import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckSquare } from "lucide-react";
import { ActivitiesApi } from "../api/endpoints";
import { activityTypeLabels, formatDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

export function Tasks() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["activities-pending"],
    queryFn: () => ActivitiesApi.list(true),
  });

  const completeMutation = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities-pending"] });
      showToast("Tarea completada");
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Tareas pendientes</h1>
      <p className="mb-6 text-sm text-slate-500">
        Llamadas, visitas y seguimientos con fecha, de todos los contactos. Se añaden desde la ficha de cada contacto.
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
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((activity) => (
                <tr key={activity.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{formatDate(activity.dueDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{activityTypeLabels[activity.type]}</td>
                  <td className="px-4 py-3 text-slate-800">{activity.description}</td>
                  <td className="px-4 py-3">
                    {activity.contact ? (
                      <Link to={`/contactos/${activity.contact.id}`} className="text-indigo-700 hover:underline">
                        {activity.contact.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => completeMutation.mutate(activity.id)}
                      className="text-xs font-medium text-indigo-700 hover:underline"
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
