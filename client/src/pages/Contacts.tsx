import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";
import { ContactsApi } from "../api/endpoints";
import { contactSourceLabels, priorityBadgeClasses, priorityLabels } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import type { Contact } from "../api/types";

export function Contacts() {
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", q],
    queryFn: () => ContactsApi.list(q || undefined),
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
      notes: String(form.get("notes") || "") || null,
    });
    e.currentTarget.reset();
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Contactos</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f]"
        >
          <UserPlus size={16} />
          {showForm ? "Cancelar" : "Nuevo contacto"}
        </button>
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
          <textarea name="notes" placeholder="Notas" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="col-span-2 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50"
          >
            Guardar contacto
          </button>
        </form>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, email o teléfono…"
        className="mb-4 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

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
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Origen</th>
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
                  </td>
                  <td className="px-4 py-3 text-slate-600">{contactSourceLabels[contact.source]}</td>
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
