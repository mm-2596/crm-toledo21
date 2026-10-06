import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, MapPin } from "lucide-react";
import { BuildingsApi, DwellingsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { dwellingTitle } from "./DwellingPanel";
import { dwellingStatusColors, dwellingStatusLabels, officeLabels } from "../lib/format";
import { useToast } from "./Toast";
import { useAuth } from "../auth/AuthContext";
import type { Property } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

/** La misma vivienda vista desde el catálogo: su edificio, estado, personas, archivos y alquileres, o cómo enlazarla con el mapa. */
export function PropertyMapLink({ property }: { property: Property }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [buildingId, setBuildingId] = useState("");
  const [choice, setChoice] = useState("new");
  const [unit, setUnit] = useState({ floor: "", door: "" });

  const { data, isLoading } = useQuery({ queryKey: ["property-dwelling", property.id], queryFn: () => DwellingsApi.byProperty(property.id) });
  const needsLinking = !isLoading && !data?.dwelling && !data?.hidden;
  const { data: buildingsData } = useQuery({ queryKey: ["buildings", "", ""], queryFn: () => BuildingsApi.list(), enabled: needsLinking });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["property-dwelling", property.id] });
    queryClient.invalidateQueries({ queryKey: ["buildings"] });
    queryClient.invalidateQueries({ queryKey: ["matches"] });
    queryClient.invalidateQueries({ queryKey: ["property", property.id] });
  };
  const onError = (error: unknown) => showToast(getErrorMessage(error, "No se pudo guardar"), "error");

  const link = useMutation({
    mutationFn: () =>
      choice === "new"
        ? DwellingsApi.create({ buildingId, floor: unit.floor || null, door: unit.door || null, propertyId: property.id })
        : DwellingsApi.update(choice, { propertyId: property.id }),
    onSuccess: () => {
      refresh();
      showToast("Propiedad vinculada con su vivienda del mapa");
    },
    onError,
  });
  const unlink = useMutation({
    mutationFn: (dwellingId: string) => DwellingsApi.update(dwellingId, { propertyId: null }),
    onSuccess: refresh,
    onError,
  });

  const buildings = buildingsData?.buildings ?? [];
  const building = buildings.find((b) => b.id === buildingId);
  const freeDwellings = (building?.dwellings ?? []).filter((d) => !d.property && !d.propertyId);
  const dwelling = data?.dwelling;
  const color = dwelling ? dwellingStatusColors[dwelling.status] : "#64748b";

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-1.5 text-lg font-medium text-[#1c1815]">
        <Building2 size={17} /> Vivienda y edificio
      </h2>
      <p className="mb-3 text-xs text-slate-400">La misma vivienda en el mapa: su edificio, quién vive, archivos, alquileres y diario.</p>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : data?.hidden ? (
        <p className="text-sm text-slate-500">Esta propiedad está enlazada con una vivienda de una oficina a la que no tienes acceso.</p>
      ) : dwelling ? (
        <div className="rounded-xl border border-slate-200 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-[#2a241f]">{dwelling.building.address}{dwelling.building.city ? `, ${dwelling.building.city}` : ""}</p>
              <p className="text-xs text-slate-500">{dwellingTitle(dwelling)} · {dwelling.building.name} · Oficina de {officeLabels[dwelling.building.office]}</p>
            </div>
            <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ background: `${color}1a`, color, borderColor: `${color}55` }}>
              {dwellingStatusLabels[dwelling.status]}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {dwelling.residents.length} {dwelling.residents.length === 1 ? "persona" : "personas"} · {dwelling.files.length} {dwelling.files.length === 1 ? "archivo" : "archivos"}
            {dwelling.contact && <> · Cliente: <Link to={`/contactos/${dwelling.contact.id}`} className="hover:underline">{dwelling.contact.name}</Link></>}
          </p>
          {(dwelling.leases ?? []).length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {(dwelling.leases ?? []).map((l) => (
                <li key={l.id}>
                  <Link to={`/alquileres/${l.id}`} className="text-xs font-medium text-[#2a241f] hover:underline">
                    Alquiler {l.status === "VIGENTE" ? "vigente" : "finalizado"}: {l.tenant?.name ?? "sin inquilino"} · {l.monthlyRent.toLocaleString("es-ES")} €/mes
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link to={`/mapa?vivienda=${dwelling.id}`} className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2a241f]">
              <MapPin size={13} /> Abrir en el mapa
            </Link>
            {user?.role !== "AGENT" && (
              <button onClick={() => window.confirm("¿Desvincular esta propiedad de su vivienda? No se borra nada.") && unlink.mutate(dwelling.id)} className="text-xs text-slate-500 hover:text-red-600 hover:underline">
                Desvincular
              </button>
            )}
          </div>
        </div>
      ) : buildingsData?.noOffice ? (
        <p className="text-sm text-slate-500">Para enlazar esta propiedad con el mapa necesitas acceso y una oficina: pídeselo a un administrador en Equipo.</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            link.mutate();
          }}
          className="grid gap-2 sm:grid-cols-2"
        >
          <p className="text-sm text-slate-600 sm:col-span-2">Todavía no está enlazada. Elige su edificio del mapa y su vivienda (o créala) para juntarlo todo.</p>
          <select value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setChoice("new"); }} aria-label="Edificio" className={`${inputClass} sm:col-span-2`}>
            <option value="">Elige el edificio…</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name} · {b.address}</option>
            ))}
          </select>
          {building && (
            <>
              <select value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="Vivienda" className={`${inputClass} sm:col-span-2`}>
                <option value="new">Crear una vivienda nueva en este edificio</option>
                {freeDwellings.map((d) => (
                  <option key={d.id} value={d.id}>{dwellingTitle(d)}</option>
                ))}
              </select>
              {choice === "new" && (
                <>
                  <input value={unit.floor} onChange={(e) => setUnit({ ...unit, floor: e.target.value })} placeholder="Planta" aria-label="Planta" className={inputClass} />
                  <input value={unit.door} onChange={(e) => setUnit({ ...unit, door: e.target.value })} placeholder="Puerta" aria-label="Puerta" className={inputClass} />
                </>
              )}
              <button type="submit" disabled={link.isPending} className="rounded-lg bg-[#1c1815] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50 sm:col-span-2">
                {link.isPending ? "Enlazando…" : "Enlazar con el mapa"}
              </button>
            </>
          )}
          <p className="text-xs text-slate-400 sm:col-span-2">¿No está el edificio? Créalo antes en el Mapa.</p>
        </form>
      )}
    </div>
  );
}
