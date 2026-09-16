"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/FavoritesContext";
import { PropertyCard } from "@/components/PropertyCard";
import type { PublicProperty } from "@/lib/types";

export default function FavoritesPage() {
  const { ids } = useFavorites();
  const [properties, setProperties] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(ids.length > 0);

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    fetch(`/api/favorites?ids=${ids.join(",")}`)
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

  return (
    <div className="mx-auto max-w-7xl px-6 pb-14 pt-28">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Tus propiedades guardadas</h1>
      </div>

      {loading ? (
        <p className="mt-12 text-sm text-ink-soft">Cargando…</p>
      ) : visibleProperties.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line p-12 text-center">
          <Heart className="mx-auto text-ink-soft" size={28} />
          <p className="mt-4 text-sm text-ink-soft">
            Todavía no has guardado ninguna propiedad. Pulsa el corazón en cualquier ficha para añadirla aquí.
          </p>
          <Link
            href="/propiedades"
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
          >
            Ver propiedades
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProperties.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
