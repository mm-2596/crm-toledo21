import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, UserPlus, Users } from "lucide-react";
import { ContactsApi } from "../api/endpoints";
import { rentalSegments, priorityBadgeClasses, priorityLabels, propertyTypeLabels, segmentBadgeClasses, segmentLabels } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { useAuth } from "../auth/AuthContext";
import type { Contact } from "../api/types";

export function Contacts() {
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState("");
  const [type, setType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const segmentEntries = Object.entries(segmentLabels).filter(([value]) => user?.role !== "ADMINISTRACION" || (rentalSegments as readonly string[]).includes(value));
  const [exporting, setExporting] = useState(false);

  async function handleExport(consentOnly: boolean) {
    setExporting(true);
    try {
      const blob = await ContactsApi.exportCsv(consentOnly);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contactos-toledo21${consentOnly ? "-con-consentimiento" : ""}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Exportación descargada");
    } catch {
      showToast("No se pudo exportar los contactos");
    } finally {
      setExporting(false);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", q, segment, type],
    queryFn: () => ContactsApi.list(q || undefined, { segment, type }),
  });

  const createMutation = useMutation({
    mutationFn: ContactsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowForm(false);
      showToast("Contacto guardado");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      name: String(form.get("name")),
      email: String(form.get("email") || "") || null,
      phone: String(form.get("phone") || "") || null,
      preferredZone: String(form.get("preferredZone") || "") || null,
      segment: (String(form.get("segment") || "") || null) as Contact["segment"],
      notes: String(form.get("notes") || "") || null,
      marketingConsent: form.get("marketingConsent") === "on",
    });
    e.currentTarget.reset();
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Contactos</h1>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "ADMIN" && (
            <>
              <button
                onClick={() => handleExport(false)}
                disabled={exporting}
                title="Descarga todos los contactos en CSV (se abre en Excel)"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download size={15} /> Exportar a Excel
              </button>
              <button
                onClick={() => handleExport(true)}
                disabled={exporting}
                title="Solo contactos con email que aceptan comunicaciones: listo para importar en Brevo u otra herramienta de email"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download size={15} /> Para email marketing
              </button>
            </>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f]"
          >
            <UserPlus size={16} />
            {showForm ? "Cancelar" : "Nuevo contacto"}
          </button>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Cada persona interesada en comprar, vender o alquilar un inmueble. Da de alta un lead en cuanto contacte contigo.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <input name="name" required placeholder="Nombre" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="phone" placeholder="Teléfono" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="preferredZone" placeholder="Zona de interés" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="segment" defaultValue="" aria-label="Tipo de cliente" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tipo de cliente (sin clasificar)</option>
            {segmentEntries.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <textarea name="notes" placeholder="Notas" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <label className="col-span-2 flex items-start gap-2 text-xs text-slate-500">
            <input type="checkbox" name="marketingConsent" className="mt-0.5" />
            Esta persona ha dado su consentimiento para recibir comunicaciones comerciales por email.
          </label>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="col-span-2 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50"
          >
            Guardar contacto
          </button>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filtrar por lo que busca" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Busca de todo</option>
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de cliente">
        {[["", "Todos"], ...segmentEntries].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSegment(value)}
            aria-pressed={segment === value}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${segment === value ? "border-[#1c1815] bg-[#1c1815] text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no hay contactos"
          description='Pulsa "Nuevo contacto" arriba a la derecha para dar de alta tu primer lead o cliente.'
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Busca</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Oportunidades</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((contact: Contact) => (
                <tr key={contact.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/contactos/${contact.id}`} className="font-medium text-[#2a241f] hover:underline">
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {contact.email || "-"} {contact.phone ? `· ${contact.phone}` : ""}
                    {contact.marketingConsent && (
                      <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Acepta emails</span>
                    )}
                    {contact.unsubscribedAt && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Baja</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.segment ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${segmentBadgeClasses[contact.segment]}`}>{segmentLabels[contact.segment]}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(contact.searches ?? []).length > 0
                      ? [...new Set((contact.searches ?? []).map((s) => `${propertyTypeLabels[s.propertyType]}${s.listingType === "ALQUILER" ? " (alq.)" : ""}`))].join(", ")
                      : contact.propertyType
                        ? propertyTypeLabels[contact.propertyType]
                        : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{contact.preferredZone || "-"}</td>
                  <td className="px-4 py-3">
                    {contact.priority ? (
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${priorityBadgeClasses[contact.priority]}`}>
                        {priorityLabels[contact.priority]}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{contact.deals?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
