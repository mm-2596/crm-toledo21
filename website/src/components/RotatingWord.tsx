"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PHRASES = ["la casa", "el piso", "el chalet", "el ático", "el dúplex"];

export function RotatingWord({ startDelay = 0 }: { startDelay?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Retrasar el primer cambio evita que coincida con el momento en que el
    // titular aparece (revealAt del Hero) — si no, la primera vez que se ve
    // la palabra puede pillarla a mitad de transición, con un hueco en blanco.
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      interval = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), 2200);
    }, startDelay * 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [startDelay]);

  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={PHRASES[index]}
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -28, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="inline-block whitespace-nowrap text-gold"
        >
          {PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
