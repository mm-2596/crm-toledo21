"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { ApartmentScene } from "@/components/toledo-render";
import { HeroComposition } from "./toledo21-home-v2/hero-composition";
import { RotatingWord } from "./RotatingWord";
import { FeaturedSpotlight } from "./FeaturedSpotlight";
import type { PublicProperty } from "@/lib/types";

const SLIDE_DURATION = 6000;

// El render conceptual (ApartmentScene) es una ilustración interactiva con su
// propia altura natural (imagen + estancias + panel + controles): no lleva
// sticky, no depende del scroll y no debe forzarse a una altura de pantalla
// fija. Por eso el hero vive en flujo normal, sin el sticky "cinematográfico"
// que tenía la versión 3D anterior.
export function Hero({ properties = [] }: { properties?: PublicProperty[] }) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (properties.length < 2 || reduceMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % properties.length), SLIDE_DURATION);
    return () => clearInterval(id);
  }, [properties.length, reduceMotion]);

  return (
    <section className="relative overflow-hidden bg-ink px-6 py-16 sm:px-10 sm:py-20">
      <HeroBackground />

      {properties[active] && <FeaturedSpotlight property={properties[active]} />}

      <div className="relative w-full">
        <HeroComposition visual={<ApartmentScene />}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="flex w-fit items-center gap-2 rounded-full border border-paper/15 bg-paper/5 py-1 pl-1 pr-3 text-xs text-paper/80 backdrop-blur-sm"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-gold">
              <ShieldCheck size={13} />
            </span>
            Agencia verificada en Getafe
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.6, delay: 0.08 }}
            className="mt-5 font-display leading-[1.03] text-paper"
          >
            Encuentra <RotatingWord /> que de verdad encaja contigo
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.55, delay: 0.16 }}
            className="mt-6 max-w-lg text-base leading-relaxed text-paper/75 sm:text-lg"
          >
            Pisos, casas y chalets en Getafe y Madrid sur con fichas completas, comparador y agentes reales
            listos para ayudarte en cada paso.
          </motion.p>
        </HeroComposition>
      </div>
    </section>
  );
}
