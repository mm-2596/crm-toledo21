"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, Bath, Scale, Maximize } from "lucide-react";
import { formatCurrency, listingTypeLabels, propertyTypeLabels } from "@/lib/format";
import { useCompare } from "./CompareContext";
import type { PublicProperty } from "@/lib/types";

export function PropertyCard({ property, index = 0 }: { property: PublicProperty; index?: number }) {
  const { toggle, isComparing, atLimit } = useCompare();
  const comparing = isComparing(property.id);
  const cover = property.images[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", bounce: 0, duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      <Link href={`/propiedades/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-dim">
          {cover ? (
            <Image
              src={cover}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-soft">Sin foto</div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur-sm">
            {listingTypeLabels[property.listingType]}
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg text-ink">{property.title}</h3>
            <p className="text-sm text-ink-soft">
              {propertyTypeLabels[property.type]} · {property.zone || property.city || "Toledo"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-ink-soft">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble size={14} /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath size={14} /> {property.bathrooms}
            </span>
          )}
          {property.areaM2 != null && (
            <span className="flex items-center gap-1">
              <Maximize size={14} /> {property.areaM2} m²
            </span>
          )}
        </div>

        <p className="mt-3 font-display text-xl text-ink">{formatCurrency(property.price)}</p>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          toggle(property.id);
        }}
        disabled={!comparing && atLimit}
        title={comparing ? "Quitar del comparador" : "Añadir al comparador"}
        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
          comparing ? "bg-gold text-paper" : "bg-paper/90 text-ink hover:bg-paper"
        } disabled:opacity-40`}
      >
        <Scale size={14} />
      </button>
    </motion.div>
  );
}
