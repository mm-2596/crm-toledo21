import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ContactsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { formatCurrency, propertyTypeLabels, segmentLabels } from "../lib/format";
import { useToast } from "./Toast";
import { useAuth } from "../auth/AuthContext";
import { rentalSegments } from "../lib/format";
import type { ClientSegment, Contact, ContactSearch, ContactSearchInput, ListingType, PropertyType } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const num = (v: string) => (v.trim() === "" ? null : Number(v));
const str = (v?: number | null) => (v == null ? "" : String(v));

interface SearchForm {
  id?: string;
  propertyType: PropertyType;
  listingType: ListingType;
  budgetMin: string;
  budgetMax: string;
  zones: string;
  bedroomsMin: string;
  bathroomsMin: string;
  areaMin: string;
  notes: string;
}

const EMPTY_SEARCH: SearchForm = { propertyType: "PISO", listingType: "VENTA", budgetMin: "", budgetMax: "", zones: "", bedroomsMin: "", bathroomsMin: "", areaMin: "", notes: "" };

function describe(s: ContactSearch) {
  const budget =
    s.budgetMin != null && s.budgetMax != null
      ? `${formatCurrency(s.budgetMin)} – ${formatCurrency(s.budgetMax)}`
      : s.budgetMax != null
        ? `hasta ${formatCurrency(s.budgetMax)}`
        : s.budgetMin != null
          ? `desde ${formatCurrency(s.budgetMin)}`
          : "sin presupuesto";
  return [
    budget,
    s.zones,
    s.bedroomsMin ? `${s.bedroomsMin}+ hab.` : null,
    s.bathroomsMin ? `${s.bathroomsMin}+ baños` : null,
    s.areaMin ? `${s.areaMin}+ m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Segmento del cliente, datos económicos (con el máximo que podría permitirse) y todo lo que busca. */
export function ContactProfile({ contact }: { contact: Contact }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const rentalOnly = user?.role === "ADMINISTRACION";
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["contact", contact.id] });
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["matches"] });
  };
  const onError = (error: unknown) => showToast(getErrorMessage(error, "No se pudo guardar"), "error");

  const [money, setMoney] = useState({
    savings: str(contact.savings),
    monthlyIncome: str(contact.monthlyIncome),
    monthlyDebts: str(contact.monthlyDebts),
    needsFinancing: contact.needsFinancing == null ? "" : contact.needsFinancing ? "yes" : "no",
  });
  const [search, setSearch] = useState<SearchForm | null>(null);

  const saveSegment = useMutation({
    mutationFn: (segment: ClientSegment | null) => ContactsApi.update(contact.id, { segment }),
    onSuccess: refresh,
    onError,
  });
  const saveMoney = useMutation({
    mutationFn: () =>
      ContactsApi.update(contact.id, {
        savings: num(money.savings),
        monthlyIncome: num(money.monthlyIncome),
        monthlyDebts: num(money.monthlyDebts),
        needsFinancing: money.needsFinancing === "" ? null : money.needsFinancing === "yes",
      }),
    onSuccess: () => {
      refresh();
      showToast("Datos económicos guardados");
    },
    onError,
  });
  const saveSearch = useMutation({
    mutationFn: (f: SearchForm) => {
      const body: ContactSearchInput = {
        propertyType: f.propertyType,
        listingType: f.listingType,
        budgetMin: num(f.budgetMin),
        budgetMax: num(f.budgetMax),
        zones: f.zones.trim() || null,
        bedroomsMin: num(f.bedroomsMin),
        bathroomsMin: num(f.bathroomsMin),
        areaMin: num(f.areaMin),
        notes: f.notes.trim() || null,
      };
      return f.id ? ContactsApi.updateSearch(f.id, body) : ContactsApi.addSearch(contact.id, body);
    },
    onSuccess: () => {
      refresh();
      setSearch(null);
      showToast("Búsqueda guardada");
    },
    onError,
  });
  const toggleSearch = useMutation({
    mutationFn: (s: ContactSearch) => ContactsApi.updateSearch(s.id, { ...s, active: !s.active }),
    onSuccess: refresh,
    onError,
  });
  const removeSearch = useMutation({ mutationFn: ContactsApi.removeSearch, onSuccess: refresh, onError });

  const searches = contact.searches ?? [];
  const hasLegacy = searches.length === 0 && Boolean(contact.propertyType || contact.budgetMax || contact.preferredZone);
  const afford = contact.affordability;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-[#1c1815]">Qué busca y su economía</h2>
        <select
          value={contact.segment ?? ""}
          onChange={(e) => saveSegment.mutate((e.target.value || null) as ClientSegment | null)}
          aria-label="Tipo de cliente"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Sin clasificar</option>
          {Object.entries(segmentLabels).filter(([value]) => !rentalOnly || (rentalSegments as readonly string[]).includes(value)).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold text-[#1c1815]">Lo que busca</h3>
          {hasLegacy && (
            <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Hasta que añadas búsquedas se usan sus preferencias de la ficha (zona, presupuesto y tipo).
            </p>
          )}
          {searches.length === 0 && !hasLegacy && !search && <p className="mt-1 text-xs text-slate-500">Todavía no hay ninguna búsqueda.</p>}
          <ul className="mt-2 flex flex-col gap-2">
            {searches.map((s) => (
              <li key={s.id} className={`rounded-lg border border-slate-200 p-3 text-sm ${s.active ? "" : "opacity-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-[#2a241f]">{propertyTypeLabels[s.propertyType]}</span>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{s.listingType === "ALQUILER" ? "Alquiler" : "Compra"}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-slate-400">
                    <button onClick={() => toggleSearch.mutate(s)} className="text-xs hover:text-slate-700">{s.active ? "Pausar" : "Activar"}</button>
                    <button
                      onClick={() =>
                        setSearch({ id: s.id, propertyType: s.propertyType, listingType: s.listingType, budgetMin: str(s.budgetMin), budgetMax: str(s.budgetMax), zones: s.zones ?? "", bedroomsMin: str(s.bedroomsMin), bathroomsMin: str(s.bathroomsMin), areaMin: str(s.areaMin), notes: s.notes ?? "" })
                      }
                      aria-label="Editar búsqueda"
                      className="hover:text-slate-700"
                    >
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => window.confirm("¿Borrar esta búsqueda?") && removeSearch.mutate(s.id)} aria-label="Borrar búsqueda" className="hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{describe(s)}</p>
                {s.notes && <p className="text-xs text-slate-500">{s.notes}</p>}
              </li>
            ))}
          </ul>

          {search ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSearch.mutate(search);
              }}
              className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3"
            >
              <p className="col-span-2 text-xs font-medium text-slate-600">{search.id ? "Editar búsqueda" : "Nueva búsqueda"}</p>
              <select value={search.propertyType} onChange={(e) => setSearch({ ...search, propertyType: e.target.value as PropertyType })} aria-label="Qué busca" className={inputClass}>
                {Object.entries(propertyTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select value={search.listingType} onChange={(e) => setSearch({ ...search, listingType: e.target.value as ListingType })} aria-label="Compra o alquiler" className={inputClass}>
                {!rentalOnly && <option value="VENTA">Comprar</option>}
                <option value="ALQUILER">Alquilar</option>
              </select>
              <input type="number" min={0} value={search.budgetMin} onChange={(e) => setSearch({ ...search, budgetMin: e.target.value })} placeholder="Presupuesto desde (€)" aria-label="Presupuesto mínimo" className={inputClass} />
              <input type="number" min={0} value={search.budgetMax} onChange={(e) => setSearch({ ...search, budgetMax: e.target.value })} placeholder="Presupuesto hasta (€)" aria-label="Presupuesto máximo" className={inputClass} />
              <input value={search.zones} onChange={(e) => setSearch({ ...search, zones: e.target.value })} placeholder="Zonas o ciudades, separadas por comas" aria-label="Zonas" className={`${inputClass} col-span-2`} />
              <input type="number" min={0} value={search.bedroomsMin} onChange={(e) => setSearch({ ...search, bedroomsMin: e.target.value })} placeholder="Hab. mínimas" aria-label="Habitaciones mínimas" className={inputClass} />
              <input type="number" min={0} value={search.bathroomsMin} onChange={(e) => setSearch({ ...search, bathroomsMin: e.target.value })} placeholder="Baños mínimos" aria-label="Baños mínimos" className={inputClass} />
              <input type="number" min={0} value={search.areaMin} onChange={(e) => setSearch({ ...search, areaMin: e.target.value })} placeholder="m² mínimos" aria-label="Metros mínimos" className={`${inputClass} col-span-2`} />
              <input value={search.notes} onChange={(e) => setSearch({ ...search, notes: e.target.value })} placeholder="Notas (opcional)" aria-label="Notas de la búsqueda" className={`${inputClass} col-span-2`} />
              <button type="submit" disabled={saveSearch.isPending} className="rounded-lg bg-[#1c1815] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">Guardar</button>
              <button type="button" onClick={() => setSearch(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-white">Cancelar</button>
            </form>
          ) : (
            <button onClick={() => setSearch({ ...EMPTY_SEARCH, listingType: rentalOnly ? "ALQUILER" : "VENTA" })} className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Plus size={15} /> Añadir búsqueda
            </button>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#1c1815]">Economía (orientativo)</h3>
          <p className="mt-1 text-xs text-slate-500">Sirve para marcar en el cruce si lo que busca le es viable. Son datos personales: trátalos con cuidado.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMoney.mutate();
            }}
            className="mt-2 grid grid-cols-2 gap-2"
          >
            <label className="text-xs text-slate-500">
              Ahorros (€)
              <input type="number" min={0} value={money.savings} onChange={(e) => setMoney({ ...money, savings: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs text-slate-500">
              Ingresos netos al mes (€)
              <input type="number" min={0} value={money.monthlyIncome} onChange={(e) => setMoney({ ...money, monthlyIncome: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs text-slate-500">
              Cuotas que ya paga al mes (€)
              <input type="number" min={0} value={money.monthlyDebts} onChange={(e) => setMoney({ ...money, monthlyDebts: e.target.value })} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs text-slate-500">
              ¿Necesita hipoteca?
              <select value={money.needsFinancing} onChange={(e) => setMoney({ ...money, needsFinancing: e.target.value })} className={`${inputClass} mt-1`}>
                <option value="">Sin indicar</option>
                <option value="yes">Sí</option>
                <option value="no">No, al contado</option>
              </select>
            </label>
            <button type="submit" disabled={saveMoney.isPending} className="col-span-2 rounded-lg bg-[#1c1815] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
              Guardar datos económicos
            </button>
          </form>
          {afford && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {afford.maxPrice != null ? (
                <>
                  Podría permitirse hasta <strong>{formatCurrency(afford.maxPrice)}{afford.listingType === "ALQUILER" ? "/mes" : ""}</strong>
                  <span className="block text-xs text-slate-500">{afford.note}</span>
                </>
              ) : (
                <span className="text-xs text-slate-500">{afford.note}</span>
              )}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
