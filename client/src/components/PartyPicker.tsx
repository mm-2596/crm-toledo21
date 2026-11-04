import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContactsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "./Toast";
import type { ClientSegment } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

/** Elige un contacto existente o crea uno nuevo con sus datos básicos (nombre, teléfono y, si se pide, correo). */
export function PartyPicker({
  label,
  segment,
  value,
  onChange,
  withDetails,
}: {
  label: string;
  segment: ClientSegment;
  value: string;
  onChange: (id: string) => void;
  /** Pide también correo, DNI y domicilio al crear el contacto. */
  withDetails?: boolean;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts", "", "", ""], queryFn: () => ContactsApi.list() });
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", email: "", dni: "", address: "" });
  const create = useMutation({
    mutationFn: () =>
      ContactsApi.create({ name: draft.name.trim(), phone: draft.phone.trim() || null, email: draft.email.trim() || null, dni: draft.dni.trim() || null, address: draft.address.trim() || null, segment }),
    onSuccess: (contact) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onChange(contact.id);
      setCreating(false);
      setDraft({ name: "", phone: "", email: "", dni: "", address: "" });
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo crear el contacto"), "error"),
  });

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={inputClass}>
        <option value="">Sin indicar</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>
        ))}
      </select>
      {creating ? (
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nombre y apellidos" aria-label={`Nombre (${label})`} className={inputClass} />
          <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Teléfono" aria-label={`Teléfono (${label})`} className={inputClass} />
          {withDetails && (
            <>
              <input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Correo (opcional)" aria-label={`Correo (${label})`} className={inputClass} />
              <input value={draft.dni} onChange={(e) => setDraft({ ...draft, dni: e.target.value })} placeholder="DNI / NIE" aria-label={`DNI o NIE (${label})`} className={inputClass} />
              <input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Domicilio (opcional)" aria-label={`Domicilio (${label})`} className={`${inputClass} col-span-2`} />
            </>
          )}
          <button type="button" disabled={!draft.name.trim() || create.isPending} onClick={() => create.mutate()} className="rounded-lg bg-[#1c1815] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">Crear y elegir</button>
          <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600">Cancelar</button>
        </div>
      ) : (
        <button type="button" onClick={() => setCreating(true)} className="w-fit text-xs font-medium text-[#2a241f] hover:underline">+ Crear contacto nuevo</button>
      )}
    </div>
  );
}
