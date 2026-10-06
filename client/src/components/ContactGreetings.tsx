import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ContactsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { formatDate } from "../lib/format";
import { useToast } from "./Toast";
import type { Contact } from "../api/types";

export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const inputClass = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

/** Consentimientos (email y WhatsApp) y cumpleaños: con la fecha, el CRM nos avisa y felicita al cliente. */
export function ContactGreetings({ contact }: { contact: Contact }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [day, setDay] = useState(contact.birthDay ? String(contact.birthDay) : "");
  const [month, setMonth] = useState(contact.birthMonth ? String(contact.birthMonth) : "");
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["contact", contact.id] });
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["birthdays"] });
  };
  const onError = (error: unknown) => showToast(getErrorMessage(error, "No se pudo guardar"), "error");

  const toggleEmail = useMutation({
    mutationFn: (value: boolean) => ContactsApi.update(contact.id, { marketingConsent: value }),
    onSuccess: (_d, value) => {
      refresh();
      showToast(value ? "Consentimiento de email registrado" : "Consentimiento de email retirado");
    },
    onError,
  });
  const toggleWhatsapp = useMutation({
    mutationFn: (value: boolean) => ContactsApi.update(contact.id, { whatsappConsent: value }),
    onSuccess: (_d, value) => {
      refresh();
      showToast(value ? "Consentimiento de WhatsApp registrado" : "Consentimiento de WhatsApp retirado");
    },
    onError,
  });
  const saveBirthday = useMutation({
    mutationFn: () => ContactsApi.update(contact.id, day && month ? { birthDay: Number(day), birthMonth: Number(month) } : { birthDay: null, birthMonth: null }),
    onSuccess: () => {
      refresh();
      showToast(day && month ? "Cumpleaños guardado" : "Cumpleaños borrado");
    },
    onError,
  });

  const changed = day !== (contact.birthDay ? String(contact.birthDay) : "") || month !== (contact.birthMonth ? String(contact.birthMonth) : "");

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-lg font-medium text-[#1c1815]">Comunicaciones y cumpleaños</h2>
      <p className="mb-3 text-sm text-slate-500">
        {contact.marketingConsent
          ? `Acepta recibir novedades por email${contact.marketingConsentAt ? ` (desde el ${formatDate(contact.marketingConsentAt)})` : ""}.`
          : contact.unsubscribedAt
            ? `Se dio de baja el ${formatDate(contact.unsubscribedAt)}. No recibirá más campañas ni felicitaciones por email.`
            : "No ha dado su consentimiento: no recibirá campañas ni felicitaciones por email."}
      </p>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={Boolean(contact.marketingConsent)} disabled={toggleEmail.isPending} onChange={(e) => toggleEmail.mutate(e.target.checked)} />
          Ha dado su consentimiento para recibir comunicaciones comerciales por email
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={Boolean(contact.whatsappConsent)} disabled={toggleWhatsapp.isPending} onChange={(e) => toggleWhatsapp.mutate(e.target.checked)} />
          Ha dado su consentimiento para recibir mensajes por WhatsApp
        </label>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-[#1c1815]">Cumpleaños</h3>
        <p className="mb-2 text-xs text-slate-500">Solo hace falta el día y el mes. El CRM te avisa ese día y, si tiene consentimiento de email, le felicita automáticamente.</p>
        <div className="flex flex-wrap items-center gap-2">
          <select value={day} onChange={(e) => setDay(e.target.value)} aria-label="Día del cumpleaños" className={inputClass}>
            <option value="">Día</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mes del cumpleaños" className={inputClass}>
            <option value="">Mes</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          {changed && (
            <button onClick={() => saveBirthday.mutate()} disabled={saveBirthday.isPending || Boolean(day) !== Boolean(month)} className="rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-40">
              {day || month ? "Guardar" : "Borrar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
