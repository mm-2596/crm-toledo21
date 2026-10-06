import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Plus, Search } from "lucide-react";
import { BuildingsApi, ContactsApi, DwellingsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { dwellingStatusColors, dwellingStatusLabels, officeLabels, saleStageLabels } from "../lib/format";
import { DwellingPanel, dwellingTitle } from "../components/DwellingPanel";
import { BuildingsMapView } from "../components/BuildingsMapView";
import { useToast } from "../components/Toast";
import { useAuth } from "../auth/AuthContext";
import type { Building, BuildingInput, DwellingStatus, Office } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const EMPTY_FORM = { name: "", address: "", city: "", office: "GETAFE" as Office, latitude: "", longitude: "" };

function StatusDot({ status }: { status: string }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: dwellingStatusColors[status] }} />;
}

function countByStatus(building: Building, status: DwellingStatus) {
  return building.dwellings.filter((d) => d.status === status).length;
}

export function BuildingsMap() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [q, setQ] = useState("");
  const [office, setOffice] = useState<Office | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<(typeof EMPTY_FORM & { id?: string }) | null>(null);
  const [dwellingId, setDwellingId] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [dwellingForm, setDwellingForm] = useState({ floor: "", door: "", status: "CENSADA" as DwellingStatus, contactId: "", notes: "" });

  const { data } = useQuery({
    queryKey: ["buildings", q, office],
    queryFn: () => BuildingsApi.list({ q: q.trim() || undefined, office: office || undefined }),
    placeholderData: keepPreviousData,
  });
  const { data: contacts } = useQuery({ queryKey: ["contacts", ""], queryFn: () => ContactsApi.list() });

  const [statusFilter, setStatusFilter] = useState<DwellingStatus | null>(null);
  const allBuildings = data?.buildings ?? [];
  const buildings = statusFilter ? allBuildings.filter((b) => b.dwellings.some((d) => d.status === statusFilter)) : allBuildings;
  const selected = buildings.find((b) => b.id === selectedId) ?? null;
  const selectedDwelling = selected?.dwellings.find((d) => d.id === dwellingId) ?? null;

  // Enlace desde las tareas de hoy, los avisos y los correos: /mapa?vivienda=ID abre esa vivienda.
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedDwelling = searchParams.get("vivienda");
  useEffect(() => {
    if (!linkedDwelling || !data) return;
    const building = data.buildings.find((b) => b.dwellings.some((d) => d.id === linkedDwelling));
    if (building) {
      setForm(null);
      setSelectedId(building.id);
      setDwellingId(linkedDwelling);
    }
    setSearchParams({}, { replace: true });
  }, [linkedDwelling, data, setSearchParams]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["buildings"] });
  const onError = (error: unknown) => showToast(getErrorMessage(error, "No se pudo guardar"), "error");

  const saveBuilding = useMutation({
    mutationFn: (input: { id?: string; data: BuildingInput }) =>
      input.id ? BuildingsApi.update(input.id, input.data) : BuildingsApi.create(input.data),
    onSuccess: (building) => {
      refresh();
      setForm(null);
      setSelectedId(building.id);
      showToast("Edificio guardado");
    },
    onError,
  });
  const removeBuilding = useMutation({
    mutationFn: BuildingsApi.remove,
    onSuccess: () => {
      refresh();
      setSelectedId(null);
      showToast("Edificio eliminado");
    },
    onError,
  });
  const addDwelling = useMutation({
    mutationFn: DwellingsApi.create,
    onSuccess: () => {
      refresh();
      setDwellingForm({ floor: "", door: "", status: "CENSADA", contactId: "", notes: "" });
      showToast("Vivienda añadida");
    },
    onError,
  });
  const draft = form && form.latitude !== "" && form.longitude !== "" && !Number.isNaN(Number(form.latitude)) && !Number.isNaN(Number(form.longitude))
    ? { lat: Number(form.latitude), lng: Number(form.longitude) }
    : null;

  function openNew() {
    setSelectedId(null);
    setForm({ ...EMPTY_FORM, office: office || user?.office || "GETAFE" });
  }

  function openEdit(b: Building) {
    setForm({ id: b.id, name: b.name, address: b.address, city: b.city ?? "", office: b.office, latitude: String(b.latitude), longitude: String(b.longitude) });
  }

  async function geocode() {
    if (!form?.address.trim()) return showToast("Escribe primero la dirección", "error");
    setGeocoding(true);
    try {
      const query = [form.address, form.city].filter(Boolean).join(", ");
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "es" } },
      );
      const results = (await res.json()) as { lat: string; lon: string }[];
      if (!results[0]) return showToast("No encuentro esa dirección. Haz clic en el mapa para colocar el punto a mano.", "error");
      setForm((f) => (f ? { ...f, latitude: Number(results[0].lat).toFixed(6), longitude: Number(results[0].lon).toFixed(6) } : f));
    } catch {
      showToast("No se pudo buscar la dirección. Haz clic en el mapa para colocar el punto.", "error");
    } finally {
      setGeocoding(false);
    }
  }

  function submitBuilding(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !draft) return showToast("Falta la posición: busca la dirección o haz clic en el mapa", "error");
    saveBuilding.mutate({
      id: form.id,
      data: { name: form.name, address: form.address, city: form.city || null, office: form.office, latitude: draft.lat, longitude: draft.lng },
    });
  }

  const totals = (["A_LA_VENTA", "A_ALQUILER", "ALQUILADA", "VENDIDA", "CENSADA"] as const).map((status) => ({
    status,
    count: allBuildings.reduce((sum, b) => sum + countByStatus(b, status), 0),
  }));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Mapa de viviendas</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f]"
        >
          <Plus size={16} /> Nuevo edificio
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Edificios y viviendas censadas de tu oficina. Busca por dirección o por el nombre del cliente o de quien vive en ella.
      </p>

      {data?.noOffice && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Todavía no tienes acceso a los edificios: un administrador debe darte permiso y asignarte una oficina en la sección
          Equipo.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Dirección, edificio o nombre de una persona…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        {isAdmin && (
          <select value={office} onChange={(e) => setOffice(e.target.value as Office | "")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todas las oficinas</option>
            {Object.entries(officeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {totals.map((t) => {
          const active = statusFilter === t.status;
          return (
            <button
              key={t.status}
              onClick={() => setStatusFilter(active ? null : t.status)}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-50 ${
                active ? "border-[#1c1815] ring-1 ring-[#1c1815]" : "border-slate-200"
              }`}
            >
              <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: dwellingStatusColors[t.status], boxShadow: `0 0 0 4px ${dwellingStatusColors[t.status]}22` }} />
              <span>
                <span className="block text-2xl font-semibold leading-none tabular-nums text-[#1c1815]">{t.count}</span>
                <span className="mt-1 block text-xs text-slate-500">{dwellingStatusLabels[t.status]}{active ? " · filtrando" : ""}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="h-[60vh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm lg:h-[calc(100vh-20rem)] lg:min-h-[520px]">
          <BuildingsMapView
            buildings={buildings}
            selectedId={selectedId}
            onSelect={(id) => {
              setForm(null);
              setDwellingId(null);
              setSelectedId(id);
            }}
            draft={draft}
            onPick={form ? (lat, lng) => setForm((f) => (f ? { ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) } : f)) : null}
          />
        </div>

        <div className="max-h-[70vh] overflow-y-auto rounded-2xl lg:max-h-[calc(100vh-20rem)] lg:min-h-[520px] border border-slate-200 bg-white p-4 shadow-sm">
          {form ? (
            <form onSubmit={submitBuilding} className="flex flex-col gap-3">
              <h2 className="text-lg font-medium text-[#1c1815]">{form.id ? "Editar edificio" : "Nuevo edificio"}</h2>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre (ej. Edificio Toledo 21)" className={inputClass} />
              <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección" className={inputClass} />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ciudad" className={inputClass} />
                <select
                  value={form.office}
                  onChange={(e) => setForm({ ...form, office: e.target.value as Office })}
                  disabled={!isAdmin}
                  className={inputClass}
                >
                  {Object.entries(officeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={geocode} disabled={geocoding} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <MapPin size={15} /> {geocoding ? "Buscando…" : "Buscar la dirección en el mapa"}
              </button>
              <p className="text-xs text-slate-500">También puedes hacer clic en el mapa para colocar o corregir el punto.</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Latitud" className={inputClass} />
                <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Longitud" className={inputClass} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saveBuilding.isPending} className="flex-1 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
                  Guardar
                </button>
                <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            </form>
          ) : selected && selectedDwelling ? (
            <DwellingPanel
              key={selectedDwelling.id}
              building={selected}
              dwelling={selectedDwelling}
              contacts={contacts ?? []}
              onBack={() => setDwellingId(null)}
              onChanged={refresh}
              onDeleted={() => {
                setDwellingId(null);
                refresh();
              }}
            />
          ) : selected ? (
            <div className="flex flex-col gap-3">
              <button onClick={() => { setSelectedId(null); setDwellingId(null); }} className="flex w-fit items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                <ArrowLeft size={13} /> Todos los edificios
              </button>
              <div>
                <h2 className="text-lg font-medium text-[#1c1815]">{selected.name}</h2>
                <p className="text-sm text-slate-500">{selected.address}{selected.city ? `, ${selected.city}` : ""}</p>
                <p className="text-xs text-slate-400">Oficina de {officeLabels[selected.office]}</p>
              </div>
              <div className="flex gap-3 text-xs">
                <button onClick={() => openEdit(selected)} className="font-medium text-[#2a241f] hover:underline">Editar</button>
                {isAdmin && (
                  <button
                    onClick={() => window.confirm(`¿Eliminar "${selected.name}" y sus ${selected.dwellings.length} viviendas?`) && removeBuilding.mutate(selected.id)}
                    className="font-medium text-red-600 hover:underline"
                  >
                    Eliminar edificio
                  </button>
                )}
              </div>

              <h3 className="mt-2 text-sm font-medium text-[#1c1815]">Viviendas ({selected.dwellings.length})</h3>
              {selected.dwellings.length === 0 && <p className="text-xs text-slate-500">Todavía no hay viviendas en este edificio.</p>}
              <ul className="flex flex-col gap-2">
                {selected.dwellings.map((d) => {
                  const match = q.trim() && (d.contact?.name.toLowerCase().includes(q.trim().toLowerCase()) || d.residents.some((r) => r.name.toLowerCase().includes(q.trim().toLowerCase())));
                  return (
                    <li key={d.id}>
                      <button
                        onClick={() => setDwellingId(d.id)}
                        className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${match ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[#2a241f]">{dwellingTitle(d)}</span>
                          <span
                            className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: `${dwellingStatusColors[d.status]}1a`, color: dwellingStatusColors[d.status], borderColor: `${dwellingStatusColors[d.status]}55` }}
                          >
                            {dwellingStatusLabels[d.status]}
                          </span>
                        </div>
                        {d.contact && <p className="text-xs text-slate-600">{d.contact.name}</p>}
                        {d.saleStage && <p className="text-xs font-medium text-[#2a241f]">{saleStageLabels[d.saleStage]}</p>}
                        <p className="mt-0.5 text-xs text-slate-400">
                          {d.residents.length} {d.residents.length === 1 ? "persona" : "personas"} · {d.files.length} {d.files.length === 1 ? "archivo" : "archivos"}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addDwelling.mutate({ buildingId: selected.id, ...dwellingForm, contactId: dwellingForm.contactId || null });
                }}
                className="mt-1 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3"
              >
                <p className="col-span-2 text-xs font-medium text-slate-600">Añadir vivienda</p>
                <input value={dwellingForm.floor} onChange={(e) => setDwellingForm({ ...dwellingForm, floor: e.target.value })} placeholder="Planta" className={inputClass} />
                <input value={dwellingForm.door} onChange={(e) => setDwellingForm({ ...dwellingForm, door: e.target.value })} placeholder="Puerta" className={inputClass} />
                <select value={dwellingForm.contactId} onChange={(e) => setDwellingForm({ ...dwellingForm, contactId: e.target.value })} className={`${inputClass} col-span-2`}>
                  <option value="">Cliente (opcional)</option>
                  {(contacts ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select value={dwellingForm.status} onChange={(e) => setDwellingForm({ ...dwellingForm, status: e.target.value as DwellingStatus })} className={`${inputClass} col-span-2`}>
                  {Object.entries(dwellingStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <input value={dwellingForm.notes} onChange={(e) => setDwellingForm({ ...dwellingForm, notes: e.target.value })} placeholder="Notas (opcional)" className={`${inputClass} col-span-2`} />
                <button type="submit" disabled={addDwelling.isPending} className="col-span-2 rounded-lg bg-[#1c1815] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
                  Añadir
                </button>
              </form>
            </div>
          ) : buildings.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-sm text-slate-500">
              <Building2 size={28} className="text-slate-300" />
              {q ? "Ningún edificio coincide con la búsqueda." : "Todavía no hay edificios. Crea el primero con «Nuevo edificio»."}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {buildings.map((b) => (
                <li key={b.id}>
                  <button onClick={() => setSelectedId(b.id)} className="w-full rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50">
                    <div className="text-sm font-medium text-[#2a241f]">{b.name}</div>
                    <div className="text-xs text-slate-500">{b.address}</div>
                    {b.dwellings.length > 0 && (
                      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                        {(["A_LA_VENTA", "A_ALQUILER", "ALQUILADA", "VENDIDA", "CENSADA"] as const).map((status) => (
                          <span key={status} style={{ width: `${(countByStatus(b, status) / b.dwellings.length) * 100}%`, background: dwellingStatusColors[status] }} />
                        ))}
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-600">
                      {(["A_LA_VENTA", "A_ALQUILER", "ALQUILADA", "VENDIDA", "CENSADA"] as const).map((status) => (
                        <span key={status} className="flex items-center gap-1" title={dwellingStatusLabels[status]}>
                          <StatusDot status={status} /> {countByStatus(b, status)}
                        </span>
                      ))}
                      <span className="ml-auto text-slate-400">{officeLabels[b.office]}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
