import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ZonePricesApi } from "../api/endpoints";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import type { ZonePrice } from "../api/types";

const TYPES = ["Piso", "Casa o chalet", "Local u oficina", "Terreno u otro"];
const CONDITIONS = ["Nuevo", "Reformado", "Buen estado", "A reformar"];
const EXTRAS = ["Ascensor", "Terraza", "Garaje", "Trastero", "Piscina", "Jardín"];

const eur = (n: number) => `${n.toLocaleString("es-ES")} €`;

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;
}

const inputClass = "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm";

/** Precio orientativo por metro cuadrado de cada zona: base de la valoración que reciben por correo quienes piden una tasación en la web. */
export function ZonePrices() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["zone-prices"], queryFn: ZonePricesApi.list });
  const rows = data?.rows ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["zone-prices"] });

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ city: "", zone: "", saleEurM2: "", notes: "" });
  const [adding, setAdding] = useState({ city: "", zone: "", saleEurM2: "", notes: "" });

  const save = useMutation({
    mutationFn: (p: { id?: string; city: string; zone: string; saleEurM2: string; notes: string; active?: boolean }) => {
      const body = { city: p.city, zone: p.zone || null, saleEurM2: Number(p.saleEurM2), notes: p.notes || null, active: p.active };
      return p.id ? ZonePricesApi.update(p.id, body) : ZonePricesApi.create(body);
    },
    onSuccess: (_d, p) => {
      refresh();
      if (p.id) setEditing(null);
      else setAdding({ city: "", zone: "", saleEurM2: "", notes: "" });
      showToast("Precio guardado");
    },
    onError: (err) => showToast(errorMessage(err, "No se pudo guardar. Revisa que el precio esté entre 300 y 30.000 €/m²."), "error"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => ZonePricesApi.remove(id),
    onSuccess: () => {
      refresh();
      showToast("Zona eliminada");
    },
    onError: () => showToast("No se pudo eliminar", "error"),
  });

  function startEdit(r: ZonePrice) {
    setEditing(r.id);
    setDraft({ city: r.city, zone: r.zone ?? "", saleEurM2: String(r.saleEurM2), notes: r.notes ?? "" });
  }

  // --- Probar el cálculo ---
  const [test, setTest] = useState({ type: "Piso", zoneId: "", address: "", areaM2: "80", condition: "Buen estado", extras: [] as string[] });
  const preview = useMutation({
    mutationFn: () => ZonePricesApi.preview({ type: test.type, zoneId: test.zoneId || null, address: test.address, areaM2: Number(test.areaM2), condition: test.condition, extras: test.extras }),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Precios por zona</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">
        Cuando alguien pide una tasación en la web, el CRM le envía por correo una <strong>valoración orientativa</strong> con un rango de precio. Se calcula con el precio por metro cuadrado
        de su zona, que defines aquí, ajustado por el estado de la vivienda y sus extras. Si la zona no tiene precio, no se envía ninguna cifra: la prepara un agente.
      </p>

      {isLoading ? (
        <p className="mt-6 text-slate-500">Cargando…</p>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ciudad</th>
                    <th className="px-4 py-3 font-medium">Zona o barrio</th>
                    <th className="px-4 py-3 font-medium">€/m² venta</th>
                    <th className="px-4 py-3 font-medium">Nota</th>
                    <th className="px-4 py-3 font-medium">Activa</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) =>
                    editing === r.id ? (
                      <tr key={r.id} className="bg-slate-50">
                        <td className="px-3 py-2"><input aria-label="Ciudad" className={inputClass} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></td>
                        <td className="px-3 py-2"><input aria-label="Zona" className={inputClass} placeholder="(toda la ciudad)" value={draft.zone} onChange={(e) => setDraft({ ...draft, zone: e.target.value })} /></td>
                        <td className="px-3 py-2"><input aria-label="Precio por metro cuadrado" type="number" className={inputClass} value={draft.saleEurM2} onChange={(e) => setDraft({ ...draft, saleEurM2: e.target.value })} /></td>
                        <td className="px-3 py-2"><input aria-label="Nota" className={inputClass} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></td>
                        <td className="px-3 py-2 text-slate-400">—</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button aria-label="Guardar" onClick={() => save.mutate({ id: r.id, ...draft, active: r.active })} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50"><Check size={16} /></button>
                            <button aria-label="Cancelar" onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={r.id} className={r.active ? "" : "text-slate-400"}>
                        <td className="px-4 py-2.5">{r.city}</td>
                        <td className="px-4 py-2.5">{r.zone ?? <span className="text-slate-400">Toda la ciudad</span>}</td>
                        <td className="px-4 py-2.5 tabular-nums">{eur(r.saleEurM2)}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{r.notes}</td>
                        <td className="px-4 py-2.5">
                          <input
                            type="checkbox"
                            aria-label={`${r.active ? "Desactivar" : "Activar"} ${r.zone ?? r.city}`}
                            checked={r.active}
                            onChange={(e) => save.mutate({ id: r.id, city: r.city, zone: r.zone ?? "", saleEurM2: String(r.saleEurM2), notes: r.notes ?? "", active: e.target.checked })}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <button aria-label="Editar" onClick={() => startEdit(r)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={15} /></button>
                            <button
                              aria-label="Eliminar"
                              onClick={() => confirm(`¿Eliminar el precio de ${r.zone ?? r.city}?`) && remove.mutate(r.id)}
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            ><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                  <tr className="bg-slate-50/60">
                    <td className="px-3 py-2"><input aria-label="Nueva ciudad" className={inputClass} placeholder="Ciudad" value={adding.city} onChange={(e) => setAdding({ ...adding, city: e.target.value })} /></td>
                    <td className="px-3 py-2"><input aria-label="Nueva zona" className={inputClass} placeholder="Zona (opcional)" value={adding.zone} onChange={(e) => setAdding({ ...adding, zone: e.target.value })} /></td>
                    <td className="px-3 py-2"><input aria-label="Nuevo precio por metro cuadrado" type="number" className={inputClass} placeholder="€/m²" value={adding.saleEurM2} onChange={(e) => setAdding({ ...adding, saleEurM2: e.target.value })} /></td>
                    <td className="px-3 py-2"><input aria-label="Nueva nota" className={inputClass} placeholder="Nota (opcional)" value={adding.notes} onChange={(e) => setAdding({ ...adding, notes: e.target.value })} /></td>
                    <td />
                    <td className="px-3 py-2">
                      <button
                        onClick={() => save.mutate(adding)}
                        disabled={!adding.city.trim() || !adding.saleEurM2}
                        className="flex items-center gap-1 rounded-lg bg-[#1c1815] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                      ><Plus size={14} /> Añadir</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <div className="mt-4">
                <EmptyState icon={Calculator} title="Aún no hay precios" description="Añade al menos el precio de cada ciudad (deja la zona vacía) y, si quieres más precisión, el de sus barrios. Mientras no haya precios, no se envía ninguna cifra al cliente." />
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">
              La zona que se aplica es la más concreta que aparezca en la dirección o la que elija la persona en el formulario; si no hay ninguna, se usa el precio de la ciudad (fila sin zona).
              Una zona desactivada no se usa.
            </p>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:self-start">
            <h2 className="flex items-center gap-2 text-base font-medium text-[#1c1815]"><Calculator size={16} /> Probar el cálculo</h2>
            <p className="mt-1 text-xs text-slate-500">Comprueba qué rango recibiría un cliente. No crea ningún contacto ni envía ningún correo.</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <label className="flex flex-col gap-1">Tipo
                <select className={inputClass} value={test.type} onChange={(e) => setTest({ ...test, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1">Zona
                <select className={inputClass} value={test.zoneId} onChange={(e) => setTest({ ...test, zoneId: e.target.value })}>
                  <option value="">Que la busque en la dirección</option>
                  {rows.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{[r.zone, r.city].filter(Boolean).join(", ")}</option>)}
                </select>
              </label>
              {!test.zoneId && (
                <label className="flex flex-col gap-1">Dirección
                  <input className={inputClass} placeholder="Calle Madrid 5, Getafe Centro" value={test.address} onChange={(e) => setTest({ ...test, address: e.target.value })} />
                </label>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">Superficie (m²)
                  <input type="number" className={inputClass} value={test.areaM2} onChange={(e) => setTest({ ...test, areaM2: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1">Estado
                  <select className={inputClass} value={test.condition} onChange={(e) => setTest({ ...test, condition: e.target.value })}>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXTRAS.map((x) => {
                  const on = test.extras.includes(x);
                  return (
                    <button key={x} type="button" aria-pressed={on} onClick={() => setTest({ ...test, extras: on ? test.extras.filter((e) => e !== x) : [...test.extras, x] })}
                      className={`rounded-full border px-3 py-1 text-xs ${on ? "border-[#1c1815] bg-[#1c1815] text-white" : "border-slate-300 text-slate-600"}`}>{x}</button>
                  );
                })}
              </div>
              <button onClick={() => preview.mutate()} disabled={!Number(test.areaM2) || preview.isPending} className="rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Calcular</button>
            </div>
            {preview.data && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                {preview.data.estimate ? (
                  <>
                    <p className="text-xs text-slate-500">Zona aplicada: {preview.data.estimate.zoneLabel} · {eur(preview.data.estimate.eurM2)}/m²</p>
                    <p className="mt-1 text-lg font-semibold text-[#1c1815]">{eur(preview.data.estimate.low)} – {eur(preview.data.estimate.high)}</p>
                    <p className="text-xs text-slate-500">Estimación central: {eur(preview.data.estimate.mid)}</p>
                  </>
                ) : (
                  <p className="text-slate-600">No se daría ninguna cifra: {test.type === "Piso" || test.type === "Casa o chalet" ? "la zona no tiene precio, o la superficie está fuera de lo habitual (25 a 500 m²)." : "solo se estiman viviendas (piso, casa o chalet)."}</p>
                )}
              </div>
            )}
            {data && (
              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                El rango es la estimación ±{Math.round(data.adjustments.margin * 100)} %. Ajustes por estado: nuevo +8 %, reformado +5 %, a reformar −12 %. Extras:{" "}
                {Object.entries(data.adjustments.extras).map(([k, v]) => `${k.toLowerCase()} +${(v * 100).toLocaleString("es-ES")} %`).join(", ")} (máximo +12 % en total).
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
