"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useCompare } from "@/components/CompareContext";
import {
  conditionLabels,
  formatCurrency,
  heatingLabels,
  listingTypeLabels,
  propertyTypeLabels,
} from "@/lib/format";
import type { PublicProperty } from "@/lib/types";

export default function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const [properties, setProperties] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(ids.length > 0);

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    fetch(`/api/compare?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProperties(data.properties || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const visibleProperties = ids.length === 0 ? [] : properties;

  const rows: { label: string; render: (p: PublicProperty) => React.ReactNode }[] = [
    { label: "Precio", render: (p) => formatCurrency(p.price) },
    { label: "Operación", render: (p) => listingTypeLabels[p.listingType] },
    { label: "Tipo", render: (p) => propertyTypeLabels[p.type] },
    { label: "Zona", render: (p) => p.zone || p.city || "—" },
    { label: "Habitaciones", render: (p) => p.bedrooms ?? "—" },
    { label: "Baños", render: (p) => p.bathrooms ?? "—" },
    { label: "Superficie construida", render: (p) => (p.areaM2 != null ? `${p.areaM2} m²` : "—") },
    { label: "Superficie útil", render: (p) => (p.usableAreaM2 != null ? `${p.usableAreaM2} m²` : "—") },
    { label: "Año de construcción", render: (p) => p.yearBuilt ?? "—" },
    { label: "Estado", render: (p) => (p.condition ? conditionLabels[p.condition] : "—") },
    { label: "Calefacción", render: (p) => (p.heating ? heatingLabels[p.heating] : "—") },
    { label: "Plazas de garaje", render: (p) => p.parkingSpaces ?? "—" },
    { label: "Certificado energético", render: (p) => p.energyRating ?? "—" },
    { label: "Gastos de comunidad", render: (p) => (p.hoaFees != null ? `${formatCurrency(p.hoaFees)}/mes` : "—") },
    { label: "Terraza", render: (p) => (p.hasTerrace ? "Sí" : "No") },
    { label: "Piscina", render: (p) => (p.hasPool ? "Sí" : "No") },
    { label: "Ascensor", render: (p) => (p.hasElevator ? "Sí" : "No") },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 pb-14 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Compara propiedades</h1>
        </div>
        {visibleProperties.length > 0 && (
          <button onClick={clear} className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            Vaciar comparador
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-12 text-sm text-ink-soft">Cargando…</p>
      ) : visibleProperties.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line p-12 text-center">
          <p className="text-sm text-ink-soft">
            Todavía no has añadido propiedades al comparador. Pulsa el icono de balanza en cualquier ficha para
            añadirla aquí (hasta 4 a la vez).
          </p>
          <Link
            href="/propiedades"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
          >
            Ver propiedades
          </Link>
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-40" />
                {visibleProperties.map((p) => (
                  <th key={p.id} className="min-w-[220px] px-4 pb-4 text-left align-top">
                    <div className="relative">
                      <button
                        onClick={() => remove(p.id)}
                        aria-label="Quitar"
                        className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-paper-dim text-ink-soft hover:text-ink"
                      >
                        <X size={14} />
                      </button>
                      <Link href={`/propiedades/${p.id}`} className="block pr-8">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper-dim">
                          {p.images[0] ? (
                            <Image src={p.images[0].url} alt={p.title} fill sizes="220px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-ink-soft">
                              Sin foto
                            </div>
                          )}
                        </div>
                        <p className="mt-2 font-display text-sm text-ink">{p.title}</p>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-paper-dim/50" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-ink-soft">{row.label}</td>
                  {visibleProperties.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-sm text-ink">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
