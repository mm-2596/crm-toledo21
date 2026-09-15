"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { RotatingWord } from "./RotatingWord";
import { FeaturedSpotlight } from "./FeaturedSpotlight";
import type { PublicProperty } from "@/lib/types";

const SLIDE_DURATION = 6000;

// El hero se queda fijo en pantalla (sticky) mientras el usuario avanza
// scroll — el protagonista de la animación es ese gesto de bajar, no un
// temporizador al cargar. La foto hace un zoom lento ligado directamente al
// scroll, y el panel de HeroSearchPanel "sube" por detrás y lo cubre al
// terminar. Ver HeroSearchPanel.tsx para la segunda mitad de este efecto.
export function Hero({ properties = [] }: { properties?: PublicProperty[] }) {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduceMotion ? 1 : 1.28]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55, 0.8], [1, 1, 0]);

  useEffect(() => {
    if (properties.length < 2 || reduceMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % properties.length), SLIDE_DURATION);
    return () => clearInterval(id);
  }, [properties.length, reduceMotion]);

  return (
    <section ref={sectionRef} className="relative h-[175vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-ink">
        <HeroBackground scale={scale} />

        {properties[active] && <FeaturedSpotlight property={properties[active]} />}

        <motion.div
          style={{ opacity: contentOpacity }}
          className="relative flex h-full flex-col justify-end px-6 pb-28 sm:px-10 sm:pb-36"
        >
          <div className="mx-auto w-full max-w-7xl">
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
              className="mt-5 max-w-4xl font-display text-4xl leading-[1.03] text-paper sm:text-6xl lg:text-7xl"
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
          </div>
        </motion.div>

        {!reduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            style={{ opacity: contentOpacity }}
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-paper/60"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Desplázate</span>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-8 w-5 items-start justify-center rounded-full border border-paper/30 p-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            </motion.span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
