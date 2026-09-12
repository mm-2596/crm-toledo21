"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { AnimatedCounter } from "./AnimatedCounter";
import { RotatingWord } from "./RotatingWord";
import { FeaturedSpotlight } from "./FeaturedSpotlight";
import type { PublicProperty } from "@/lib/types";

const SLIDE_DURATION = 6000;

export function Hero({ properties = [] }: { properties?: PublicProperty[] }) {
  const router = useRouter();
  const [listingType, setListingType] = useState<"VENTA" | "ALQUILER">("VENTA");
  const [city, setCity] = useState("");
  const [active, setActive] = useState(0);

  const images = properties.map((p) => p.images[0]?.url).filter((u): u is string => !!u);

  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "22%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, reduceMotion ? 1 : 0]);

  useEffect(() => {
    if (images.length < 2 || reduceMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % images.length), SLIDE_DURATION);
    return () => clearInterval(id);
  }, [images.length, reduceMotion]);

  function goTo(index: number) {
    setActive(((index % images.length) + images.length) % images.length);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ listingType });
    if (city.trim()) params.set("city", city.trim());
    router.push(`/propiedades?${params.toString()}`);
  }

  return (
    <section id="hero" ref={sectionRef} className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-[1.25]">
        <HeroBackground images={images} active={active} />
      </motion.div>

      {images.length > 1 && (
        <>
          <button
            onClick={() => goTo(active - 1)}
            aria-label="Foto anterior"
            className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-paper/20 bg-ink/40 text-paper backdrop-blur-md hover:bg-ink/60 sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(active + 1)}
            aria-label="Foto siguiente"
            className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-paper/20 bg-ink/40 text-paper backdrop-blur-md hover:bg-ink/60 sm:flex"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir a la foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-gold" : "w-1.5 bg-paper/40"}`}
              />
            ))}
          </div>
        </>
      )}

      {properties[active] && <FeaturedSpotlight property={properties[active]} />}

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto flex w-full max-w-7xl flex-col items-start px-6 py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 py-1 pl-1 pr-3 text-xs text-paper/80 backdrop-blur-sm"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-gold">
            <ShieldCheck size={13} />
          </span>
          Agencia verificada en Toledo
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.55, delay: 0.05 }}
          className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] text-paper sm:text-6xl"
        >
          Encuentra <RotatingWord /> que de verdad encaja contigo
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.55, delay: 0.1 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg"
        >
          Pisos, casas y chalets en Toledo con fichas completas, comparador y agentes reales listos para ayudarte en
          cada paso.
        </motion.p>

        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.55, delay: 0.18 }}
          className="mt-10 flex w-full max-w-xl flex-col gap-2 rounded-2xl border border-paper/10 bg-ink/50 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
        >
          <div className="flex overflow-hidden rounded-xl bg-paper/10 p-1 text-sm">
            {(["VENTA", "ALQUILER"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setListingType(option)}
                className={`rounded-lg px-3 py-2 font-medium transition-colors ${
                  listingType === option ? "bg-gold text-ink" : "text-paper/70 hover:text-paper"
                }`}
              >
                {option === "VENTA" ? "Comprar" : "Alquilar"}
              </button>
            ))}
          </div>

          <div className="hidden w-px self-stretch bg-paper/10 sm:block" />

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Zona o barrio…"
            className="min-w-0 flex-1 border-t border-paper/10 bg-transparent px-3 py-2 text-sm text-paper placeholder:text-paper/40 focus:outline-none sm:border-t-0"
          />

          <button
            type="submit"
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02] sm:mt-0"
          >
            <Search size={16} />
            Buscar
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-paper/15 pt-8 text-paper"
        >
          <Stat prefix="+" value={150} label="Propiedades gestionadas" />
          <Stat value={98} suffix="%" label="Clientes satisfechos" />
          <Stat value={24} suffix="h" label="Respuesta media" />
        </motion.div>
      </motion.div>
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
      <div className="font-display text-2xl text-paper sm:text-3xl">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </div>
      <div className="mt-1 text-xs text-paper/60">{label}</div>
    </div>
  );
}
