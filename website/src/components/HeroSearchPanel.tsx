"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

// El panel que "sube" y cubre el hero fotográfico al hacer scroll (ver
// Hero.tsx: el hero se queda fijo mientras este panel, con esquinas
// redondeadas, entra por debajo). Aquí vive lo práctico — buscador y
// cifras — separado del momento cinematográfico de la foto.
export function HeroSearchPanel() {
  const router = useRouter();
  const [listingType, setListingType] = useState<"VENTA" | "ALQUILER">("VENTA");
  const [city, setCity] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ listingType });
    if (city.trim()) params.set("city", city.trim());
    router.push(`/propiedades?${params.toString()}`);
  }

  return (
    <section className="relative z-10 -mt-16 rounded-t-[2.5rem] bg-paper pb-16 pt-10 sm:-mt-24 sm:rounded-t-[3rem] sm:pb-20 sm:pt-14">
      <div className="mx-auto max-w-7xl px-6">
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-line bg-paper-dim/60 p-2 shadow-lg shadow-black/5 sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
        >
          <div className="flex overflow-hidden rounded-xl bg-paper p-1 text-sm">
            {(["VENTA", "ALQUILER"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setListingType(option)}
                className={`rounded-lg px-3 py-2 font-medium transition-colors ${
                  listingType === option ? "bg-gold text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {option === "VENTA" ? "Comprar" : "Alquilar"}
              </button>
            ))}
          </div>

          <div className="hidden w-px self-stretch bg-line sm:block" />

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Zona o barrio…"
            className="min-w-0 flex-1 border-t border-line bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none sm:border-t-0"
          />

          <button
            type="submit"
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-transform hover:scale-[1.02] sm:mt-0"
          >
            <Search size={16} />
            Buscar
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-12 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-line pt-8 text-ink"
        >
          <Stat prefix="+" value={150} label="Propiedades gestionadas" />
          <Stat value={98} suffix="%" label="Clientes satisfechos" />
          <Stat value={24} suffix="h" label="Respuesta media" />
        </motion.div>
      </div>
    </section>
  );
}

function Stat({
  value,
  prefix,
  suffix,
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  return (
    <div>
      <div className="font-display text-2xl text-ink sm:text-3xl">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </div>
      <div className="mt-1 text-xs text-ink-soft">{label}</div>
    </div>
  );
}
