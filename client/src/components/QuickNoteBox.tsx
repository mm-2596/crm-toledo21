import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check } from "lucide-react";
import { ProspectionsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { parseProspectNote } from "../lib/prospectNote";
import { formatDateTime } from "../lib/format";
import { useToast } from "./Toast";

const QUICK_DATES: { label: string; days?: number; months?: number }[] = [
  { label: "Mañana", days: 1 },
  { label: "En una semana", days: 7 },
  { label: "En 15 días", days: 15 },
  { label: "En un mes", months: 1 },
  { label: "En 3 meses", months: 3 },
];

function inFuture(q: { days?: number; months?: number }): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (q.days) d.setDate(d.getDate() + q.days);
  if (q.months) d.setMonth(d.getMonth() + q.months);
  return d;
}

/**
 * Nota rápida: se escribe lo hablado tal cual ("He hablado con Paca y me ha dicho que la llame en un mes")
 * y el CRM lo guarda en el historial del piso y, si se dice cuándo, crea el aviso para volver a llamar.
 */
export function QuickNoteBox({ dwellingId }: { dwellingId: string }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<Date | null>(null);
  const parsed = useMemo(() => (text.trim() ? parseProspectNote(text) : null), [text]);

  const reminder = parsed?.reminder ?? (picked ? { date: picked, hasTime: false } : null);
  const callText = parsed?.person ? `Llamar a ${parsed.person}` : "Volver a llamar";

  const save = useMutation({
    mutationFn: () =>
      ProspectionsApi.quickNote(dwellingId, {
        note: parsed!.note,
        callAt: reminder ? reminder.date.toISOString() : null,
        hasTime: reminder?.hasTime ?? false,
        callText,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dwelling-activities", dwellingId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["prospections"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-calls"] });
      setText("");
      setPicked(null);
      showToast(reminder ? "Nota guardada y aviso creado" : "Nota guardada");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar la nota"), "error"),
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <label htmlFor={`quick-${dwellingId}`} className="sr-only">Nota rápida</label>
      <textarea
        id={`quick-${dwellingId}`}
        rows={2}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPicked(null);
        }}
        placeholder="Escribe lo hablado, p. ej.: He hablado con Paca y me ha dicho que la llame en un mes"
        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      {parsed && (
        <div className="mt-2 flex flex-col gap-2 text-xs">
          {reminder ? (
            <p className="flex items-start gap-1.5 text-emerald-800">
              <BellRing size={13} className="mt-0.5 shrink-0" />
              <span>Te avisaré el <strong>{formatDateTime(reminder.date.toISOString(), reminder.hasTime)}</strong>: «{callText}».</span>
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 text-slate-600">
              <p>{parsed.reminderUnclear ? "No he entendido cuándo volver a llamar. ¿Te aviso…?" : "No has dicho cuándo volver a llamar. Si quieres un aviso, elige:"}</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DATES.map((q) => (
                  <button key={q.label} type="button" onClick={() => setPicked(inFuture(q))} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-100">
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              <Check size={13} /> Guardar nota{reminder ? " y aviso" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
