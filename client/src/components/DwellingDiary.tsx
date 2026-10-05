import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check } from "lucide-react";
import { ActivitiesApi, DwellingsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { activityTypeLabels, formatDate, formatDateTime } from "../lib/format";
import { useToast } from "./Toast";
import { useAuth } from "../auth/AuthContext";
import type { ActivityType } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const LOG_TYPES: ActivityType[] = ["LLAMADA", "VISITA", "WHATSAPP", "EMAIL", "REUNION", "NOTA"];
const NEXT_TYPES: ActivityType[] = ["LLAMADA", "VISITA", "WHATSAPP", "EMAIL", "REUNION", "TAREA"];

function dueDateFields(date: string, time: string): { dueDate: string | null; hasTime: boolean } {
  if (!date) return { dueDate: null, hasTime: false };
  if (time) return { dueDate: new Date(`${date}T${time}`).toISOString(), hasTime: true };
  return { dueDate: new Date(date).toISOString(), hasTime: false };
}

/** Diario de una vivienda: lo hablado cada día y la siguiente acción, que avisa al responsable en su fecha. */
export function DwellingDiary({ dwellingId }: { dwellingId: string }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [log, setLog] = useState({ type: "LLAMADA" as ActivityType, description: "" });
  const [next, setNext] = useState({ type: "LLAMADA" as ActivityType, description: "", date: "", time: "" });

  const { data: entries = [] } = useQuery({ queryKey: ["dwelling-activities", dwellingId], queryFn: () => DwellingsApi.activities(dwellingId) });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dwelling-activities", dwellingId] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      if (log.description.trim()) await DwellingsApi.addActivity(dwellingId, { type: log.type, description: log.description.trim() });
      if (next.date) {
        await DwellingsApi.addActivity(dwellingId, {
          type: next.type,
          description: next.description.trim() || `${activityTypeLabels[next.type]} pendiente`,
          ...dueDateFields(next.date, next.time),
        });
      }
    },
    onSuccess: () => {
      refresh();
      setLog((l) => ({ ...l, description: "" }));
      setNext((n) => ({ ...n, description: "", date: "", time: "" }));
      showToast("Anotado en el diario");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar"), "error"),
  });
  const complete = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: refresh,
    onError: (error) => showToast(getErrorMessage(error, "No se pudo completar"), "error"),
  });

  const pending = entries.filter((e) => !e.completed && e.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const history = entries.filter((e) => e.completed || !e.dueDate);
  const canSave = Boolean(log.description.trim() || next.date);

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) save.mutate();
        }}
        className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3"
      >
        <p className="text-xs font-medium text-slate-600">Lo que habéis hablado hoy</p>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <select value={log.type} onChange={(e) => setLog({ ...log, type: e.target.value as ActivityType })} aria-label="Cómo habéis hablado" className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            {LOG_TYPES.map((t) => (
              <option key={t} value={t}>{activityTypeLabels[t]}</option>
            ))}
          </select>
          <textarea value={log.description} onChange={(e) => setLog({ ...log, description: e.target.value })} rows={2} placeholder="Ej. Quiere bajar el precio, vuelvo a llamar…" aria-label="Lo hablado" className={inputClass} />
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <CalendarClock size={13} /> Programar la siguiente acción <span className="font-normal text-slate-400">(te avisará ese día)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <select value={next.type} onChange={(e) => setNext({ ...next, type: e.target.value as ActivityType })} aria-label="Tipo de la siguiente acción" className={inputClass}>
            {NEXT_TYPES.map((t) => (
              <option key={t} value={t}>{activityTypeLabels[t]}</option>
            ))}
          </select>
          <input type="date" value={next.date} onChange={(e) => setNext({ ...next, date: e.target.value })} aria-label="Fecha de la siguiente acción" className={inputClass} />
          <input type="time" value={next.time} onChange={(e) => setNext({ ...next, time: e.target.value })} disabled={!next.date} aria-label="Hora (opcional)" className={inputClass} />
          <input value={next.description} onChange={(e) => setNext({ ...next, description: e.target.value })} placeholder="Qué hacer" aria-label="Qué hacer" className={inputClass} />
        </div>
        <button type="submit" disabled={!canSave || save.isPending} className="rounded-lg bg-[#1c1815] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-40">
          {save.isPending ? "Guardando…" : "Guardar en el diario"}
        </button>
      </form>

      {pending.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {pending.map((a) => (
            <li key={a.id} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              <CalendarClock size={15} className="mt-0.5 shrink-0 text-amber-700" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-amber-900">{activityTypeLabels[a.type]} · {formatDateTime(a.dueDate, a.hasTime)}</p>
                <p className="text-xs text-amber-900/80">{a.description}</p>
                <p className="text-xs text-amber-900/60">{a.agent?.name}</p>
              </div>
              {(user?.role === "ADMIN" || a.agentId === user?.id) && (
                <button onClick={() => complete.mutate(a.id)} aria-label="Marcar como hecha" className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-900 hover:underline">
                  <Check size={13} /> Hecha
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {history.length === 0 && pending.length === 0 ? (
        <p className="text-xs text-slate-500">Todavía no hay nada anotado.</p>
      ) : (
        <ol className="flex flex-col gap-2 border-l border-slate-200 pl-3">
          {history.map((a) => (
            <li key={a.id} className="text-sm">
              <p className="text-xs text-slate-400">
                {formatDate(a.createdAt)} · {activityTypeLabels[a.type]}{a.agent?.name ? ` · ${a.agent.name}` : ""}
                {a.dueDate && <span> · hecha ({formatDateTime(a.dueDate, a.hasTime)})</span>}
              </p>
              <p className="whitespace-pre-wrap text-[#2a241f]">{a.description}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
