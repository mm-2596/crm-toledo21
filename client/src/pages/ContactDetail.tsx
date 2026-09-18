import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Sparkles, Wand2 } from "lucide-react";
import { ActivitiesApi, ContactsApi } from "../api/endpoints";
import {
  activityTypeLabels,
  contactSourceLabels,
  formatCurrency,
  formatDate,
  priorityBadgeClasses,
  priorityLabels,
} from "../lib/format";
import { LeadQualifier } from "../components/LeadQualifier";
import { useToast } from "../components/Toast";

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showQualifier, setShowQualifier] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: () => ContactsApi.get(id as string),
    enabled: Boolean(id),
  });

  const hasPreferences = Boolean(contact?.propertyType || contact?.preferredZone || contact?.budgetMax);
  const { data: matches } = useQuery({
    queryKey: ["contact-matches", id],
    queryFn: () => ContactsApi.matches(id as string),
    enabled: Boolean(id) && hasPreferences,
  });

  const addActivity = useMutation({
    mutationFn: ActivitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      showToast("Tarea añadida");
    },
  });

  const completeActivity = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      showToast("Tarea completada");
    },
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
      <Link to="/contactos" className="text-sm text-slate-800 hover:underline">
        ← Volver a contactos
      </Link>
      <div className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">{contact.name}</h1>
          <p className="text-sm text-slate-500">
            {contact.email || "Sin email"} · {contact.phone || "Sin teléfono"} · Origen: {contactSourceLabels[contact.source]}
          </p>
        </div>
        {contact.priority && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityBadgeClasses[contact.priority]}`}>
            Prioridad {priorityLabels[contact.priority].toLowerCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-slate-900">Oportunidades</h2>
          {(contact.deals ?? []).length === 0 && <p className="text-sm text-slate-400">Sin oportunidades.</p>}
          <ul className="flex flex-col gap-2">
            {(contact.deals ?? []).map((deal) => (
              <li key={deal.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <div className="font-medium text-slate-800">{deal.stage?.name}</div>
                <div className="text-slate-500">{deal.property?.title || "Sin propiedad asociada"}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-slate-900">Preferencias del lead</h2>
          <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
            <dt className="text-slate-400">Zona</dt>
            <dd className="text-slate-700">{contact.preferredZone || "-"}</dd>
            <dt className="text-slate-400">Operación</dt>
            <dd className="text-slate-700">{contact.listingType === "ALQUILER" ? "Alquiler" : contact.listingType === "VENTA" ? "Compra" : "-"}</dd>
            <dt className="text-slate-400">Presupuesto</dt>
            <dd className="text-slate-700">{contact.budgetMax ? `hasta ${contact.budgetMax.toLocaleString("es-ES")} €` : "-"}</dd>
            <dt className="text-slate-400">Habitaciones</dt>
            <dd className="text-slate-700">{contact.bedroomsMin ?? "-"}</dd>
            <dt className="text-slate-400">Financiación</dt>
            <dd className="text-slate-700">{contact.needsFinancing == null ? "-" : contact.needsFinancing ? "Sí" : "No"}</dd>
          </dl>

          {!showQualifier ? (
            <button
              onClick={() => setShowQualifier(true)}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
            >
              <Sparkles size={14} />
              Cualificar lead con IA
            </button>
          ) : (
            <div className="mt-4">
              <LeadQualifier
                contactId={contact.id}
                onSaved={() => {
                  queryClient.invalidateQueries({ queryKey: ["contact", id] });
                  queryClient.invalidateQueries({ queryKey: ["contact-matches", id] });
                  showToast("Lead cualificado y guardado");
                  setShowQualifier(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {hasPreferences && (matches ?? []).length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
          <div className="mb-3 flex items-center gap-1.5 text-slate-800">
            <Wand2 size={16} />
            <h2 className="text-sm font-semibold">Propiedades recomendadas para este lead</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(matches ?? []).map((property) => (
              <Link
                key={property.id}
                to={`/propiedades/${property.id}`}
                className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="font-medium text-slate-800">{property.title}</div>
                <div className="text-xs text-slate-500">{property.zone || property.city}</div>
                <div className="mt-1 font-semibold text-slate-800">{formatCurrency(property.price)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Notas</h2>
        <p className="whitespace-pre-wrap text-sm text-slate-600">{contact.notes || "Sin notas."}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Actividad y tareas</h2>

        <form onSubmit={handleAddActivity} className="mb-4 grid grid-cols-4 gap-2">
          <select name="type" className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            {Object.entries(activityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input name="description" required placeholder="Descripción" className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <input name="dueDate" type="date" className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <button
            type="submit"
            className="col-span-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Añadir
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {(contact.activities ?? []).map((activity) => (
            <li
              key={activity.id}
              className={`flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm ${
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
                  className="text-xs font-medium text-slate-800 hover:underline"
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
