"use client";

import { motion, useReducedMotion } from "framer-motion";

const ITEMS = [
  "Comprar",
  "Alquilar",
  "Centro",
  "Las Margaritas",
  "Sector III",
  "Pisos",
  "Casas",
  "Chalets",
  "Áticos",
  "Tasación gratuita",
  "Agentes verificados",
  "Certificado energético",
];

export function InfiniteMarquee() {
  const reduceMotion = useReducedMotion();
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-line bg-paper py-6">
      <motion.div
        className="flex w-max items-center gap-10 whitespace-nowrap"
        animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-xl text-ink-soft sm:text-2xl">
            {item}
            <span className="text-gold">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
