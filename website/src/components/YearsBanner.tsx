"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";

const START_YEAR = 1997;
const PLACES = ["Getafe", "Leganés", "Puerto de Sagunto"];

function YearTicker({ run }: { run: boolean }) {
  const reduceMotion = useReducedMotion();
  const [year, setYear] = useState(START_YEAR);

  useEffect(() => {
    if (!run) return;
    const target = new Date().getFullYear();
    const controls = animate(START_YEAR, target, {
      duration: reduceMotion ? 0 : 2.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setYear(Math.round(v)),
    });
    return () => controls.stop();
  }, [run, reduceMotion]);

  return <span className="tabular-nums">{year}</span>;
}

export function YearsBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      className="relative mt-14 overflow-hidden rounded-3xl border border-gold/40 bg-gold-soft px-6 py-10 sm:px-12 sm:py-14"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-gold/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-10 h-72 w-72 rounded-full bg-paper/70 blur-3xl" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink/60">Desde 1997 en el sector</p>
          <p className="mt-2 font-display text-7xl leading-none tracking-tight text-ink sm:text-8xl">
            <AnimatedCounter value={25} prefix="+" />
            <span className="ml-3 text-4xl sm:text-5xl">años</span>
          </p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/70 sm:text-base">
            Entre las agencias más serias y cualificadas de Getafe y Madrid sur. Comprar, vender o alquilar con
            quien lleva media vida haciéndolo.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {PLACES.map((place, i) => (
              <motion.span
                key={place}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: 0.5 + i * 0.12, type: "spring", bounce: 0.3, duration: 0.5 }}
                className="rounded-full border border-ink/15 bg-paper/70 px-4 py-1.5 text-sm text-ink"
              >
                {place}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[280px]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.7, rotate: -8 }}
            animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
            transition={{ type: "spring", bounce: 0.45, duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [-1.5, 1.5, -1.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/logo/toledo21-mascot.png"
                alt="Casita de Toledo21 guiñando el ojo con los pulgares hacia arriba"
                width={888}
                height={660}
                className="h-auto w-full"
              />
            </motion.div>
          </motion.div>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: 10 }}
            animate={inView ? { opacity: 1, scale: 1, y: 0 } : undefined}
            transition={{ delay: 1, type: "spring", bounce: 0.5, duration: 0.6 }}
            className="absolute -right-2 -top-3 rotate-6 rounded-2xl rounded-bl-sm bg-ink px-4 py-2 text-sm font-medium text-paper shadow-lg sm:-right-6"
          >
            ¡Contigo desde 1997!
          </motion.p>
        </div>
      </div>

      <div className="relative mt-12">
        <div className="flex items-center justify-between font-display text-lg text-ink">
          <span>{START_YEAR}</span>
          <span className="text-ink/70">
            <YearTicker run={inView} />
          </span>
        </div>
        <div className="relative mt-3 h-1.5 w-full rounded-full bg-ink/10">
          <motion.div
            className="h-full origin-left rounded-full bg-ink"
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : undefined}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-gold shadow"
            initial={reduceMotion ? false : { left: "0%" }}
            animate={inView ? { left: "100%" } : undefined}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  );
}
