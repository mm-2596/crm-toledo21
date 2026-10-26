"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Car, Flower2, Package, SlidersHorizontal, Sun, Trash2, Waves, MoveVertical } from "lucide-react";
import { propertyTypeLabels } from "@/lib/format";
import type { PropertyFilters } from "@/lib/types";

const EXTRAS = [
  { key: "elevator", label: "Ascensor", Icon: MoveVertical },
  { key: "pool", label: "Piscina", Icon: Waves },
  { key: "terrace", label: "Terraza", Icon: Sun },
  { key: "garden", label: "Jardín", Icon: Flower2 },
  { key: "parking", label: "Garaje", Icon: Car },
  { key: "storage", label: "Trastero", Icon: Package },
] as const;

type ExtraKey = (typeof EXTRAS)[number]["key"];

const inputClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60";

export function PropertyFiltersBar({ filters }: { filters: PropertyFilters }) {
  const router = useRouter();
  const [form, setForm] = useState({
    type: filters.type || "",
    listingType: filters.listingType || "",
    city: filters.city || "",
    bedroomsMin: filters.bedroomsMin || "",
    bathroomsMin: filters.bathroomsMin || "",
    priceMin: filters.priceMin || "",
    priceMax: filters.priceMax || "",
    areaMin: filters.areaMin || "",
    areaMax: filters.areaMax || "",
    sort: filters.sort || "",
  });
  const [extras, setExtras] = useState<Record<ExtraKey, boolean>>({
    elevator: filters.elevator === "1",
    pool: filters.pool === "1",
    terrace: filters.terrace === "1",
    garden: filters.garden === "1",
    parking: filters.parking === "1",
    storage: filters.storage === "1",
  });

  function go(next: typeof form, nextExtras: Record<ExtraKey, boolean>) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    EXTRAS.forEach(({ key }) => {
      if (nextExtras[key]) params.set(key, "1");
    });
    router.push(`/propiedades${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    go(form, extras);
  }

  function clear() {
    const empty = Object.fromEntries(Object.keys(form).map((k) => [k, ""])) as typeof form;
    const none = Object.fromEntries(EXTRAS.map(({ key }) => [key, false])) as Record<ExtraKey, boolean>;
    setForm(empty);
    setExtras(none);
    go(empty, none);
  }

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form onSubmit={apply} className="rounded-2xl border border-line bg-paper-dim/60 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Field label="Operación">
          <select value={form.listingType} onChange={(e) => update("listingType", e.target.value)} className={inputClass}>
            <option value="">Todas</option>
            <option value="VENTA">Venta</option>
            <option value="ALQUILER">Alquiler</option>
          </select>
        </Field>

        <Field label="Tipo">
          <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputClass}>
            <option value="">Todos</option>
            {Object.entries(propertyTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ciudad">
          <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Getafe…" className={inputClass} />
        </Field>

        <Field label="Habitaciones">
          <select value={form.bedroomsMin} onChange={(e) => update("bedroomsMin", e.target.value)} className={inputClass}>
            <option value="">Cualquiera</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </Field>

        <Field label="Baños">
          <select value={form.bathroomsMin} onChange={(e) => update("bathroomsMin", e.target.value)} className={inputClass}>
            <option value="">Cualquiera</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ordenar por">
          <select value={form.sort} onChange={(e) => update("sort", e.target.value)} className={inputClass}>
            <option value="">Más recientes</option>
            <option value="price_asc">Precio: de menor a mayor</option>
            <option value="price_desc">Precio: de mayor a menor</option>
          </select>
        </Field>

        <Field label="Precio mín. (€)">
          <input type="number" min={0} value={form.priceMin} onChange={(e) => update("priceMin", e.target.value)} className={inputClass} />
        </Field>

        <Field label="Precio máx. (€)">
          <input type="number" min={0} value={form.priceMax} onChange={(e) => update("priceMax", e.target.value)} className={inputClass} />
        </Field>

        <Field label="Superficie mín. (m²)">
          <input type="number" min={0} value={form.areaMin} onChange={(e) => update("areaMin", e.target.value)} className={inputClass} />
        </Field>

        <Field label="Superficie máx. (m²)">
          <input type="number" min={0} value={form.areaMax} onChange={(e) => update("areaMax", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Extras de la vivienda">
        {EXTRAS.map(({ key, label, Icon }) => {
          const on = extras[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => setExtras((prev) => ({ ...prev, [key]: !prev[key] }))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-soft hover:border-ink/40 hover:text-ink"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-medium text-paper transition-transform hover:scale-[1.02]"
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-soft hover:text-ink"
        >
          <Trash2 size={14} aria-hidden="true" />
          Borrar filtros
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
