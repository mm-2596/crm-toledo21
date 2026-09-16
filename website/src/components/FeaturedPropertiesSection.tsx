"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DarkPropertyCard } from "./DarkPropertyCard";
import type { PublicProperty } from "@/lib/types";

export function FeaturedPropertiesSection({ sale, rent }: { sale: PublicProperty[]; rent: PublicProperty[] }) {
  const [mode, setMode] = useState<"VENTA" | "ALQUILER">("VENTA");
  const properties = mode === "VENTA" ? sale : rent;

  return (
    <section className="bg-ink py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-display text-3xl text-paper sm:text-4xl">Propiedades destacadas</h2>
          </div>

          <div className="flex overflow-hidden rounded-full border border-paper/15 bg-paper/5 p-1 text-sm">
            {(["VENTA", "ALQUILER"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setMode(option)}
                className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
                  mode === option ? "bg-gold text-ink" : "text-paper/60 hover:text-paper"
                }`}
              >
                {option === "VENTA" ? "Comprar" : "Alquilar"}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          >
            {properties.length > 0 ? (
              <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property, i) => (
                  <DarkPropertyCard key={property.id} property={property} index={i} />
                ))}
              </div>
            ) : (
              <p className="mt-12 text-center text-sm text-paper/50">
                Todavía no hay propiedades en {mode === "VENTA" ? "venta" : "alquiler"}. Vuelve pronto.
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 text-center">
          <Link
            href={`/propiedades?listingType=${mode}`}
            className="group inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-sm text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Ver todas las propiedades
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
