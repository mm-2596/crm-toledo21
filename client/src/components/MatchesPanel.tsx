import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarPlus, Phone, Users } from "lucide-react";
import { MatchesApi, VisitsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { bandInfo, formatCurrency, viabilityInfo } from "../lib/format";
import { useToast } from "./Toast";
import type { MatchItem } from "../api/types";

interface Props {
  kind: "property" | "dwelling";
  id: string;
  /** Dónde se quedará por defecto (la dirección del inmueble), para enseñarlo en el formulario. */
  address?: string | null;
  compact?: boolean;
}

function Legend() {
  return (
    <ul aria-label="Leyenda de colores" className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
      {(["OK", "NARANJA", "ROJO"] as const).map((band) => (
        <li key={band} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: bandInfo[band].dot }} /> {bandInfo[band].label}
        </li>
      ))}
    </ul>
  );
}

function VisitForm({ match, kind, id, address, onDone }: { match: MatchItem; kind: Props["kind"]; id: string; address?: string | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState({ date: "", time: "", location: "", notes: "" });
  const create = useMutation({
    mutationFn: () =>
      VisitsApi.create({
        contactId: match.contactId,
        ...(kind === "property" ? { propertyId: id } : { dwellingId: id }),
        when: new Date(`${form.date}T${form.time}`).toISOString(),
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dwelling-activities"] });
      showToast(`Visita agendada con ${match.name}`);
      onDone();
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo agendar la visita"), "error"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
      className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3"
    >
      <p className="col-span-2 text-xs font-medium text-slate-600">Agendar visita con {match.name}</p>
      <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Día de la visita" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} aria-label="Hora de la visita" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        placeholder={address ? `Sitio: ${address}` : "Sitio: la dirección del inmueble"}
        aria-label="Sitio de la visita (opcional)"
        className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas (opcional)" aria-label="Notas de la visita" className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <p className="col-span-2 text-xs text-slate-500">Si no cambias el sitio, se queda en la dirección del inmueble. Te avisaremos antes de la visita.</p>
      <button type="submit" disabled={create.isPending} className="rounded-lg bg-[#1c1815] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
        {create.isPending ? "Agendando…" : "Agendar"}
      </button>
      <button type="button" onClick={onDone} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-white">
        Cancelar
      </button>
    </form>
  );
}

/** «Clientes que buscan esto»: el cruce de demanda de un inmueble, con colores por presupuesto y botón para agendar la visita. */
export function MatchesPanel({ kind, id, address, compact }: Props) {
  const [visitFor, setVisitFor] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["matches", kind, id],
    queryFn: () => (kind === "property" ? MatchesApi.forProperty(id) : MatchesApi.forDwelling(id)),
  });

  if (isLoading) return <p className="text-sm text-slate-500">Buscando clientes…</p>;
  if (isError || !data) return <p className="text-sm text-red-600">No se pudo hacer el cruce.</p>;
  if (data.needsPrice) {
    return <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Pon el precio y las características de la vivienda en «Datos de la vivienda» para ver qué clientes la buscan.</p>;
  }

  const unit = data.listingType === "ALQUILER" ? "/mes" : "";
  return (
    <div className="flex flex-col gap-3">
      <Legend />
      {data.matches.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-6 text-center text-sm text-slate-500">
          <Users size={24} className="text-slate-300" />
          Ningún cliente busca algo así a {data.price ? `${formatCurrency(data.price)}${unit}` : "este precio"} (o hasta un 40 % de diferencia).
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.matches.map((m) => {
            const band = bandInfo[m.band];
            const via = viabilityInfo[m.viability];
            return (
              <li key={m.contactId} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${band.badge}`} title={band.label}>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: band.dot }} />
                    {m.band === "NARANJA" || m.band === "ROJO" ? `${band.short} · ${m.deviationPct} % fuera` : band.short}
                  </span>
                  <Link to={`/contactos/${m.contactId}`} className="font-medium text-[#2a241f] hover:underline">{m.name}</Link>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${via.className}`} title={m.viabilityDetail}>{via.label}</span>
                  {m.priority === "ALTA" && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-700">Prioridad alta</span>}
                </div>
                <p className={`mt-1 text-xs text-slate-600 ${compact ? "" : "sm:ml-0"}`}>
                  Busca {m.budget} · {m.search}
                </p>
                {m.warnings.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {m.warnings.map((w) => (
                      <li key={w} className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800">{w}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-[11px] text-slate-400">{m.viabilityDetail}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      <Phone size={13} /> {m.phone}
                    </a>
                  )}
                  <button
                    onClick={() => setVisitFor(visitFor === m.contactId ? null : m.contactId)}
                    className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#2a241f]"
                  >
                    <CalendarPlus size={13} /> Agendar visita
                  </button>
                </div>
                {visitFor === m.contactId && <VisitForm match={m} kind={kind} id={id} address={address} onDone={() => setVisitFor(null)} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
