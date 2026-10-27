import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { BuildingsApi, DwellingsApi, ProspectionsApi, UsersApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "./Toast";
import { findDwelling, formatUnit } from "../lib/prospectNote";
import { prospectStatusLabels, sellInterestLabels } from "../lib/format";
import type { ProspectStatus, SellInterest } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

const EMPTY = {
  buildingId: "",
  floor: "",
  door: "",
  owner: "",
  phone: "",
  prospectStatus: "EN_SEGUIMIENTO" as ProspectStatus,
  sellInterest: "" as SellInterest | "",
  agentId: "",
  note: "",
  callDate: "",
  callTime: "",
};

/** Alta manual de una prospección: edificio, piso, propietario y primera conversación, sin pasar por el asistente. */
export function NewProspectionForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [f, setF] = useState({ ...EMPTY, agentId: user?.id ?? "" });
  const set = (patch: Partial<typeof EMPTY>) => setF((prev) => ({ ...prev, ...patch }));

  const { data } = useQuery({ queryKey: ["buildings", "new-prospection"], queryFn: () => BuildingsApi.list() });
  const { data: people = [] } = useQuery({ queryKey: ["assignable-users"], queryFn: UsersApi.assignable });
  const buildings = useMemo(() => [...(data?.buildings ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [data]);
  const building = buildings.find((b) => b.id === f.buildingId);
  const existing = building && f.floor ? findDwelling({ floor: f.floor, door: f.door || null }, building.dwellings) : null;

  const save = useMutation({
    mutationFn: async () => {
      const common = {
        prospectStatus: f.prospectStatus,
        sellInterest: f.sellInterest || null,
        agentId: f.agentId || null,
      };
      const dwelling = existing
        ? await DwellingsApi.update(existing.id, common)
        : await DwellingsApi.create({ buildingId: f.buildingId, floor: f.floor.trim(), door: f.door.trim() || null, status: "CENSADA", ...common });
      const ownerName = f.owner.trim();
      const known = (existing?.residents ?? []).some((r) => r.name.trim().toLowerCase() === ownerName.toLowerCase());
      if (ownerName && !known) await DwellingsApi.addResident(dwelling.id, { name: ownerName, role: "PROPIETARIO", phone: f.phone.trim() || null });
      if (f.note.trim() || f.callDate) {
        const callAt = f.callDate ? (f.callTime ? new Date(`${f.callDate}T${f.callTime}`) : new Date(`${f.callDate}T00:00`)) : null;
        await ProspectionsApi.quickNote(dwelling.id, {
          note: f.note.trim() || "Prospección iniciada.",
          callAt: callAt ? callAt.toISOString() : null,
          hasTime: Boolean(callAt && f.callTime),
          callText: `Llamar${ownerName ? ` a ${ownerName}` : ""} · ${formatUnit(f.floor, f.door)}, ${building?.address ?? ""}`,
        });
      }
      return dwelling;
    },
    onSuccess: () => {
      for (const key of ["prospections", "prospect-calls", "buildings", "notifications", "dwelling-activities"]) queryClient.invalidateQueries({ queryKey: [key] });
      showToast(existing ? "Prospección actualizada" : "Prospección creada");
      onClose();
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar la prospección"), "error"),
  });

  const valid = Boolean(f.buildingId && f.floor.trim());

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) save.mutate();
      }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-[#1c1815]">Nueva prospección</h2>
          <p className="mt-0.5 text-xs text-slate-500">Un piso que quieres captar. Si el piso ya está en el mapa, se actualiza; si no, se añade.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-3">
          Edificio *
          <select className={inputClass} value={f.buildingId} onChange={(e) => set({ buildingId: e.target.value })} required>
            <option value="">Elige un edificio…</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.address}{b.city ? `, ${b.city}` : ""} — {b.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-1">
          Planta *
          <input className={inputClass} value={f.floor} onChange={(e) => set({ floor: e.target.value })} placeholder="3" required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-2">
          Puerta
          <input className={inputClass} value={f.door} onChange={(e) => set({ door: e.target.value })} placeholder="B, izquierda…" />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-3">
          Propietario
          <input className={inputClass} value={f.owner} onChange={(e) => set({ owner: e.target.value })} placeholder="Nombre de la persona" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-3">
          Teléfono
          <input className={inputClass} value={f.phone} onChange={(e) => set({ phone: e.target.value })} type="tel" placeholder="600 000 000" />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-2">
          Estado
          <select className={inputClass} value={f.prospectStatus} onChange={(e) => set({ prospectStatus: e.target.value as ProspectStatus })}>
            {Object.entries(prospectStatusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-2">
          Interés en vender
          <select className={inputClass} value={f.sellInterest} onChange={(e) => set({ sellInterest: e.target.value as SellInterest | "" })}>
            <option value="">Sin indicar</option>
            {Object.entries(sellInterestLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-2">
          Comercial
          <select className={inputClass} value={f.agentId} onChange={(e) => set({ agentId: e.target.value })}>
            <option value="">Sin asignar</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-6">
          Primera conversación (opcional)
          <textarea className={`${inputClass} resize-y`} rows={2} value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="Qué se habló con el propietario" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-3">
          Volver a llamar el día (opcional)
          <input className={inputClass} type="date" value={f.callDate} onChange={(e) => set({ callDate: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-3">
          A la hora (opcional)
          <input className={inputClass} type="time" value={f.callTime} onChange={(e) => set({ callTime: e.target.value })} disabled={!f.callDate} />
        </label>
      </div>

      {existing && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Ese piso ya existe en el mapa: se actualizará su prospección en vez de crear otro.</p>}
      {data && buildings.length === 0 && (
        <p className="mt-3 text-xs text-slate-500">No hay edificios cargados. Crea primero el edificio en el <Link to="/mapa" className="underline">Mapa de viviendas</Link>.</p>
      )}
      {buildings.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">¿No está el edificio? Créalo antes en el <Link to="/mapa" className="underline">Mapa de viviendas</Link>.</p>
      )}

      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={!valid || save.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          <Plus size={14} /> {save.isPending ? "Guardando…" : "Guardar prospección"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
      </div>
    </form>
  );
}
