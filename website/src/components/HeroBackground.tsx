"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// Decoración ambiental del hero (resplandor + partículas). El objeto 3D ya
// no vive aquí: ahora es Hero3D dentro de HeroComposition, con su propia
// altura y sin posicionamiento absoluto de pantalla completa (ver Hero.tsx).
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      <Glow />
      <FloatingParticles />
    </div>
  );
}

function Glow() {
  return (
    <div className="absolute inset-0 [mix-blend-mode:screen]">
      <div className="absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-[58%] rounded-full bg-gold/30 blur-[150px]" />
    </div>
  );
}

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: `${(i * 31) % 100}%`,
        size: 2 + ((i * 13) % 5),
        duration: 9 + ((i * 7) % 10),
        delay: (i % 6) * 1.3,
      })),
    [],
  );

  return (
    <div className="absolute inset-0">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "-15%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full bg-gold/70"
          style={{ left: p.left, width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}
