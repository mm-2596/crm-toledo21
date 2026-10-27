import { useMutation, useQuery } from "@tanstack/react-query";
import { UsersApi, DwellingsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { prospectStatusLabels, sellInterestLabels } from "../lib/format";
import { useToast } from "./Toast";
import { QuickNoteBox } from "./QuickNoteBox";
import type { Dwelling, ProspectStatus, SellInterest } from "../api/types";

const selectClass = "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm";

/** Prospección del piso: estado, interés en vender, comercial y nota rápida. */
export function DwellingProspect({ dwelling, onChanged }: { dwelling: Dwelling; onChanged: () => void }) {
  const { showToast } = useToast();
  const { data: people = [] } = useQuery({ queryKey: ["assignable-users"], queryFn: UsersApi.assignable });
  const save = useMutation({
    mutationFn: (patch: { prospectStatus?: ProspectStatus | null; sellInterest?: SellInterest | null; agentId?: string | null }) => DwellingsApi.update(dwelling.id, patch),
    onSuccess: () => {
      onChanged();
      showToast("Prospección actualizada");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar"), "error"),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Estado
          <select
            className={selectClass}
            value={dwelling.prospectStatus ?? ""}
            onChange={(e) => save.mutate({ prospectStatus: (e.target.value || null) as ProspectStatus | null })}
          >
            <option value="">No es una prospección</option>
            {Object.entries(prospectStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Interés en vender
          <select
            className={selectClass}
            value={dwelling.sellInterest ?? ""}
            onChange={(e) => save.mutate({ sellInterest: (e.target.value || null) as SellInterest | null })}
          >
            <option value="">Sin indicar</option>
            {Object.entries(sellInterestLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Comercial
          <select className={selectClass} value={dwelling.agentId ?? ""} onChange={(e) => save.mutate({ agentId: e.target.value || null })}>
            <option value="">Sin asignar</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>
      {dwelling.prospectStatus === "CAPTADO" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Captado: el piso ya está «A la venta». Crea o enlaza su ficha en «Ficha en Propiedades» más abajo para publicarlo.
        </p>
      )}
      <QuickNoteBox dwellingId={dwelling.id} />
    </div>
  );
}
