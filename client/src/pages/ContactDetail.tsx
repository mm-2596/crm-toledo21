import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ActivitiesApi, ContactsApi } from "../api/endpoints";
import { activityTypeLabels, contactSourceLabels, formatDate } from "../lib/format";

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: () => ContactsApi.get(id as string),
    enabled: Boolean(id),
  });

  const addActivity = useMutation({
    mutationFn: ActivitiesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact", id] }),
  });

  const completeActivity = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact", id] }),
  });

  function handleAddActivity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    addActivity.mutate({
      contactId: id,
      type: String(form.get("type")) as never,
      description: String(form.get("description")),
      dueDate: form.get("dueDate") ? new Date(String(form.get("dueDate"))).toISOString() : null,
    });
    e.currentTarget.reset();
  }

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!contact) return <p className="text-red-600">Contacto no encontrado.</p>;

  return (
    <div>
      <Link to="/contactos" className="text-sm text-indigo-700 hover:underline">
        ← Volver a contactos
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold text-slate-900">{contact.name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {contact.email || "Sin email"} · {contact.phone || "Sin teléfono"} · Origen: {contactSourceLabels[contact.source]}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-slate-900">Oportunidades</h2>
          {(contact.deals ?? []).length === 0 && <p className="text-sm text-slate-400">Sin oportunidades.</p>}
          <ul className="flex flex-col gap-2">
            {(contact.deals ?? []).map((deal) => (
              <li key={deal.id} className="rounded-md border border-slate-100 px-3 py-2 text-sm">
                <div className="font-medium text-slate-800">{deal.stage?.name}</div>
                <div className="text-slate-500">{deal.property?.title || "Sin propiedad asociada"}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-slate-900">Notas</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{contact.notes || "Sin notas."}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Actividad y tareas</h2>

        <form onSubmit={handleAddActivity} className="mb-4 grid grid-cols-4 gap-2">
          <select name="type" className="rounded-md border border-slate-300 px-2 py-2 text-sm">
            {Object.entries(activityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input name="description" required placeholder="Descripción" className="col-span-2 rounded-md border border-slate-300 px-2 py-2 text-sm" />
          <input name="dueDate" type="date" className="rounded-md border border-slate-300 px-2 py-2 text-sm" />
          <button
            type="submit"
            className="col-span-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Añadir
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {(contact.activities ?? []).map((activity) => (
            <li
              key={activity.id}
              className={`flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm ${
                activity.completed ? "opacity-50" : ""
              }`}
            >
              <div>
                <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {activityTypeLabels[activity.type]}
                </span>
                {activity.description}
                {activity.dueDate && <span className="ml-2 text-xs text-slate-400">({formatDate(activity.dueDate)})</span>}
              </div>
              {!activity.completed && (
                <button
                  onClick={() => completeActivity.mutate(activity.id)}
                  className="text-xs font-medium text-indigo-700 hover:underline"
                >
                  Completar
                </button>
              )}
            </li>
          ))}
          {(contact.activities ?? []).length === 0 && <p className="text-sm text-slate-400">Sin actividad.</p>}
        </ul>
      </div>
    </div>
  );
}
