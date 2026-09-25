import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Sparkles, Wand2 } from "lucide-react";
import { ActivitiesApi, ContactsApi, UsersApi } from "../api/endpoints";
import {
  activityTypeLabels,
  contactSourceLabels,
  formatCurrency,
  formatDate,
  formatDateTime,
  priorityBadgeClasses,
  priorityLabels,
} from "../lib/format";
import { LeadQualifier } from "../components/LeadQualifier";
import { useToast } from "../components/Toast";

/** Con hora, se interpreta en la zona horaria del navegador (la del agente); sin hora, cuenta solo el día. */
function dueDateFields(date: string, time: string): { dueDate: string | null; hasTime: boolean } {
  if (!date) return { dueDate: null, hasTime: false };
  if (time) return { dueDate: new Date(`${date}T${time}`).toISOString(), hasTime: true };
  return { dueDate: new Date(date).toISOString(), hasTime: false };
}

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

  const { data: agents } = useQuery({ queryKey: ["assignable-users"], queryFn: UsersApi.assignable });

  const toggleConsent = useMutation({
    mutationFn: (value: boolean) => ContactsApi.update(id as string, { marketingConsent: value }),
    onSuccess: (_data, value) => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      showToast(value ? "Consentimiento registrado" : "Consentimiento retirado");
    },
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
      ...dueDateFields(String(form.get("dueDate") || ""), String(form.get("dueTime") || "")),
      agentId: String(form.get("agentId") || "") || undefined,
    });
    e.currentTarget.reset();
  }

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!contact) return <p className="text-red-600">Contacto no encontrado.</p>;

  return (
    <div>
      <Link to="/contactos" className="text-sm text-[#2a241f] hover:underline">
        ← Volver a contactos
      </Link>
      <div className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#1c1815]">{contact.name}</h1>
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
          <h2 className="mb-3 text-lg font-medium text-[#1c1815]">Oportunidades</h2>
          {(contact.deals ?? []).length === 0 && <p className="text-sm text-slate-400">Sin oportunidades.</p>}
          <ul className="flex flex-col gap-2">
            {(contact.deals ?? []).map((deal) => (
              <li key={deal.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <div className="font-medium text-[#2a241f]">{deal.stage?.name}</div>
                <div className="text-slate-500">{deal.property?.title || "Sin propiedad asociada"}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-[#1c1815]">Preferencias del lead</h2>
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
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-[#2a241f] hover:bg-slate-100"
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
          <div className="mb-3 flex items-center gap-1.5 text-[#2a241f]">
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
                <div className="font-medium text-[#2a241f]">{property.title}</div>
                <div className="text-xs text-slate-500">{property.zone || property.city}</div>
                <div className="mt-1 font-semibold text-[#2a241f]">{formatCurrency(property.price)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-medium text-[#1c1815]">Comunicaciones por email</h2>
        <p className="mb-3 text-sm text-slate-500">
          {contact.marketingConsent
            ? `Acepta recibir novedades por email${contact.marketingConsentAt ? ` (desde el ${formatDate(contact.marketingConsentAt)})` : ""}.`
            : contact.unsubscribedAt
              ? `Se dio de baja el ${formatDate(contact.unsubscribedAt)}. No recibirá más campañas.`
              : "No ha dado su consentimiento: no recibirá campañas de email."}
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={Boolean(contact.marketingConsent)}
            disabled={toggleConsent.isPending}
            onChange={(e) => toggleConsent.mutate(e.target.checked)}
          />
          Ha dado su consentimiento para recibir comunicaciones comerciales
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-[#1c1815]">Notas</h2>
        <p className="whitespace-pre-wrap text-sm text-slate-600">{contact.notes || "Sin notas."}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-[#1c1815]">Actividad y tareas</h2>

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
          <input name="dueTime" type="time" title="Hora (opcional): con hora, el agente recibe un aviso antes" className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <select name="agentId" defaultValue="" className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="">Responsable: yo</option>
            {(agents ?? []).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <p className="col-span-4 text-xs text-slate-400">Pon fecha y hora para que el responsable reciba un aviso 30 minutos antes.</p>
          <button
            type="submit"
            className="col-span-4 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f]"
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
                {activity.dueDate && <span className="ml-2 text-xs text-slate-400">({formatDateTime(activity.dueDate, activity.hasTime)})</span>}
              </div>
              {!activity.completed && (
                <button
                  onClick={() => completeActivity.mutate(activity.id)}
                  className="text-xs font-medium text-[#2a241f] hover:underline"
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
