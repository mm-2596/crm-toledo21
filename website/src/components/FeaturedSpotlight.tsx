"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BedDouble, Bath, Maximize, ArrowRight } from "lucide-react";
import { formatCurrency, listingTypeLabels } from "@/lib/format";
import type { PublicProperty } from "@/lib/types";

export function FeaturedSpotlight({ property }: { property: PublicProperty }) {
  return (
    <div className="pointer-events-none absolute inset-x-6 top-24 hidden justify-end lg:inset-x-10 lg:flex lg:top-28">
      <AnimatePresence mode="wait">
        <motion.div
          key={property.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", bounce: 0, duration: 0.45 }}
          className="pointer-events-auto w-full max-w-[280px] rounded-2xl border border-paper/15 bg-ink/60 p-4 text-paper shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Destacado · {listingTypeLabels[property.listingType]}
          </div>
          <h3 className="mt-2 font-display text-lg leading-tight text-paper">{property.title}</h3>
          <p className="mt-1 text-xs text-paper/60">{property.zone || property.city || "Getafe"}</p>

          <div className="mt-3 flex items-center gap-3 text-xs text-paper/70">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble size={13} /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath size={13} /> {property.bathrooms}
              </span>
            )}
            {property.areaM2 != null && (
              <span className="flex items-center gap-1">
                <Maximize size={13} /> {property.areaM2} m²
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="font-display text-lg text-paper">{formatCurrency(property.price)}</p>
            <Link
              href={`/propiedades/${property.id}`}
              className="group flex items-center gap-1 text-xs font-medium text-gold"
            >
              Ver ficha
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
