import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ContactsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "./Toast";
import type { Contact } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

/** DNI/NIE y domicilio del contacto (uso interno: propietarios, contratos). */
export function ContactIdentity({ contact }: { contact: Contact }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [dni, setDni] = useState(contact.dni ?? "");
  const [address, setAddress] = useState(contact.address ?? "");
  const changed = dni !== (contact.dni ?? "") || address !== (contact.address ?? "");
  const save = useMutation({
    mutationFn: () => ContactsApi.update(contact.id, { dni: dni.trim() || null, address: address.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contact.id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      showToast("Datos guardados");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar"), "error"),
  });

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-medium text-[#1c1815]">Datos de identificación</h2>
      <p className="mb-3 text-xs text-slate-400">Uso interno: no se publican ni se envían en ningún correo.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="contact-dni" className="mb-1 block text-xs font-medium text-slate-500">DNI / NIE / pasaporte</label>
          <input id="contact-dni" value={dni} onChange={(e) => setDni(e.target.value)} maxLength={20} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="contact-address" className="mb-1 block text-xs font-medium text-slate-500">Domicilio</label>
          <input id="contact-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} className={inputClass} />
        </div>
      </div>
      {changed && (
        <button onClick={() => save.mutate()} disabled={save.isPending} className="mt-3 rounded-lg bg-[#1c1815] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
          {save.isPending ? "Guardando…" : "Guardar datos"}
        </button>
      )}
    </div>
  );
}
