"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, Bath, Maximize, MapPin, ArrowRight, Scale } from "lucide-react";
import { formatCurrency, listingTypeLabels, propertyTypeLabels } from "@/lib/format";
import { useCompare } from "./CompareContext";
import type { PublicProperty } from "@/lib/types";

export function DarkPropertyCard({ property, index = 0 }: { property: PublicProperty; index?: number }) {
  const { toggle, isComparing, atLimit } = useCompare();
  const comparing = isComparing(property.id);
  const cover = property.images[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", bounce: 0, duration: 0.45, delay: Math.min(index * 0.08, 0.3) }}
      className="group overflow-hidden rounded-2xl border border-paper/10 bg-paper/[0.03] backdrop-blur-sm"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-paper/5 text-sm text-paper/40">Sin foto</div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gold backdrop-blur-sm">
          {propertyTypeLabels[property.type]}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(property.id);
          }}
          disabled={!comparing && atLimit}
          title={comparing ? "Quitar del comparador" : "Añadir al comparador"}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
            comparing ? "bg-gold text-ink" : "bg-ink/60 text-paper hover:bg-ink/80"
          } disabled:opacity-40`}
        >
          <Scale size={14} />
        </button>
      </div>

      <div className="p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gold">
          {listingTypeLabels[property.listingType]}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-snug text-paper">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-paper/50">
          <MapPin size={12} />
          {property.zone || property.city || "Toledo"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1 rounded-lg bg-paper/5 px-2.5 py-1 text-xs text-paper/70">
              <BedDouble size={13} /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1 rounded-lg bg-paper/5 px-2.5 py-1 text-xs text-paper/70">
              <Bath size={13} /> {property.bathrooms}
            </span>
          )}
          {property.areaM2 != null && (
            <span className="flex items-center gap-1 rounded-lg bg-paper/5 px-2.5 py-1 text-xs text-paper/70">
              <Maximize size={13} /> {property.areaM2} m²
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-paper/10 pt-4">
          <p className="font-display text-xl text-paper">{formatCurrency(property.price)}</p>
          <Link
            href={`/propiedades/${property.id}`}
            className="group/link flex items-center gap-1.5 rounded-full bg-paper px-4 py-2 text-xs font-medium text-ink transition-transform hover:scale-[1.03]"
          >
            Ver ficha
            <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
