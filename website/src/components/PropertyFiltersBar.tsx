"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { propertyTypeLabels } from "@/lib/format";
import type { PropertyFilters } from "@/lib/types";

export function PropertyFiltersBar({ filters }: { filters: PropertyFilters }) {
  const router = useRouter();
  const [form, setForm] = useState({
    type: filters.type || "",
    listingType: filters.listingType || "",
    city: filters.city || "",
    bedroomsMin: filters.bedroomsMin || "",
    priceMin: filters.priceMin || "",
    priceMax: filters.priceMax || "",
  });

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/propiedades${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-paper-dim/60 p-4"
    >
      <Field label="Operación">
        <select
          value={form.listingType}
          onChange={(e) => update("listingType", e.target.value)}
          className="w-36 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        >
          <option value="">Todas</option>
          <option value="VENTA">Venta</option>
          <option value="ALQUILER">Alquiler</option>
        </select>
      </Field>

      <Field label="Tipo">
        <select
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
          className="w-40 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        >
          <option value="">Todos</option>
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ciudad">
        <input
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="Getafe…"
          className="w-36 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60"
        />
      </Field>

      <Field label="Hab. mín.">
        <input
          type="number"
          min={0}
          value={form.bedroomsMin}
          onChange={(e) => update("bedroomsMin", e.target.value)}
          className="w-24 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </Field>

      <Field label="Precio mín.">
        <input
          type="number"
          min={0}
          value={form.priceMin}
          onChange={(e) => update("priceMin", e.target.value)}
          className="w-28 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </Field>

      <Field label="Precio máx.">
        <input
          type="number"
          min={0}
          value={form.priceMax}
          onChange={(e) => update("priceMax", e.target.value)}
          className="w-28 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </Field>

      <button
        type="submit"
        className="rounded-lg bg-ink px-5 py-2 text-sm font-medium text-paper transition-transform hover:scale-[1.02]"
      >
        Filtrar
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
