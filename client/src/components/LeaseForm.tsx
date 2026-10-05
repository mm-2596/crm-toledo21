import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BuildingsApi, ContactsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { dwellingTitle } from "./DwellingPanel";
import { leaseStatusLabels } from "../lib/format";
import { isoDay } from "../lib/leases";
import { useToast } from "./Toast";
import type { ClientSegment, Lease, LeaseInput, LeaseStatus } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const num = (v: string) => (v.trim() === "" ? null : Number(v));

function PartyPicker({ label, segment, value, onChange }: { label: string; segment: ClientSegment; value: string; onChange: (id: string) => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts", "", "", ""], queryFn: () => ContactsApi.list() });
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "" });
  const create = useMutation({
    mutationFn: () => ContactsApi.create({ name: draft.name.trim(), phone: draft.phone.trim() || null, segment }),
    onSuccess: (contact) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onChange(contact.id);
      setCreating(false);
      setDraft({ name: "", phone: "" });
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo crear el contacto"), "error"),
  });

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={inputClass}>
        <option value="">Sin indicar</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {creating ? (
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nombre" aria-label={`Nombre (${label})`} className={inputClass} />
          <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Teléfono" aria-label={`Teléfono (${label})`} className={inputClass} />
          <button type="button" disabled={!draft.name.trim() || create.isPending} onClick={() => create.mutate()} className="rounded-lg bg-[#1c1815] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">Crear y elegir</button>
          <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600">Cancelar</button>
        </div>
      ) : (
        <button type="button" onClick={() => setCreating(true)} className="w-fit text-xs font-medium text-[#2a241f] hover:underline">+ Crear contacto nuevo</button>
      )}
    </div>
  );
}

interface Props {
  /** Al editar viene el alquiler; al crear, la vivienda se elige o llega ya fijada. */
  lease?: Lease;
  presetDwellingId?: string | null;
  submitLabel: string;
  pending: boolean;
  onSubmit: (data: LeaseInput, dwellingId: string) => void;
  onCancel: () => void;
}

export function LeaseForm({ lease, presetDwellingId, submitLabel, pending, onSubmit, onCancel }: Props) {
  const { data: buildingsData } = useQuery({ queryKey: ["buildings", "", ""], queryFn: () => BuildingsApi.list(), enabled: !lease });
  const buildings = buildingsData?.buildings ?? [];
  const presetBuilding = presetDwellingId ? buildings.find((b) => b.dwellings.some((d) => d.id === presetDwellingId))?.id : undefined;

  const [buildingId, setBuildingId] = useState("");
  const [dwellingId, setDwellingId] = useState(presetDwellingId ?? lease?.dwellingId ?? "");
  const [f, setF] = useState({
    ownerId: lease?.ownerId ?? "",
    tenantId: lease?.tenantId ?? "",
    monthlyRent: lease ? String(lease.monthlyRent) : "",
    deposit: lease?.deposit != null ? String(lease.deposit) : "",
    startDate: isoDay(lease?.startDate),
    endDate: isoDay(lease?.endDate),
    status: (lease?.status ?? "VIGENTE") as LeaseStatus,
    notes: lease?.notes ?? "",
  });

  const effectiveBuildingId = buildingId || presetBuilding || "";
  const building = buildings.find((b) => b.id === effectiveBuildingId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(
          {
            ownerId: f.ownerId || null,
            tenantId: f.tenantId || null,
            monthlyRent: Number(f.monthlyRent),
            deposit: num(f.deposit),
            startDate: f.startDate,
            endDate: f.endDate || null,
            status: f.status,
            notes: f.notes.trim() || null,
          },
          dwellingId,
        );
      }}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
    >
      {!lease && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Edificio</label>
            <select value={effectiveBuildingId} onChange={(e) => { setBuildingId(e.target.value); setDwellingId(""); }} aria-label="Edificio" className={inputClass}>
              <option value="">Elige el edificio…</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name} · {b.address}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Vivienda</label>
            <select required value={dwellingId} onChange={(e) => setDwellingId(e.target.value)} aria-label="Vivienda" disabled={!building} className={inputClass}>
              <option value="">{building ? "Elige la vivienda…" : "Primero elige el edificio"}</option>
              {(building?.dwellings ?? []).map((d) => (
                <option key={d.id} value={d.id}>{dwellingTitle(d)}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400">¿No está? Créala antes en el Mapa, dentro de su edificio.</p>
          </div>
        </>
      )}
      <PartyPicker label="Propietario" segment="PROPIETARIO" value={f.ownerId} onChange={(id) => setF({ ...f, ownerId: id })} />
      <PartyPicker label="Arrendatario (inquilino)" segment="INQUILINO" value={f.tenantId} onChange={(id) => setF({ ...f, tenantId: id })} />
      <label className="text-xs text-slate-500">
        Renta mensual (€)
        <input type="number" required min={0} value={f.monthlyRent} onChange={(e) => setF({ ...f, monthlyRent: e.target.value })} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-slate-500">
        Fianza (€)
        <input type="number" min={0} value={f.deposit} onChange={(e) => setF({ ...f, deposit: e.target.value })} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-slate-500">
        Inicio del contrato
        <input type="date" required value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-slate-500">
        Fin del contrato
        <input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} className={`${inputClass} mt-1`} />
        <span className="mt-1 block text-[11px] text-slate-400">Te avisaremos 90 y 30 días antes.</span>
      </label>
      {lease && (
        <label className="text-xs text-slate-500">
          Estado
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as LeaseStatus })} className={`${inputClass} mt-1`}>
            {Object.entries(leaseStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      )}
      <label className={`text-xs text-slate-500 ${lease ? "" : "sm:col-span-2"}`}>
        Notas
        <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} className={`${inputClass} mt-1`} />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending || (!lease && !dwellingId)} className="rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
          {pending ? "Guardando…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
      </div>
    </form>
  );
}
