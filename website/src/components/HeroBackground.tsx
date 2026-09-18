"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, type MotionValue } from "framer-motion";

// three.js/WebGL solo puede montarse en el navegador — se carga en cliente
// puro para que Next no intente prerenderizarlo ni tocarlo durante el SSR.
const Hero3D = dynamic(() => import("./Hero3D").then((m) => m.Hero3D), { ssr: false });

// El hero se queda fijo en pantalla mientras se hace scroll (ver Hero.tsx);
// ese mismo progreso de scroll (0 a 1) se le pasa al lienzo 3D para que
// acerque y gire ligeramente el conjunto de nodos al bajar por la página.
export function HeroBackground({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      <Glow />
      <Hero3D progress={progress} />
      <FloatingParticles />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
    </div>
  );
}

function Glow() {
  return (
    <div className="absolute inset-0 [mix-blend-mode:screen]">
      <div className="absolute bottom-0 left-1/2 h-[26rem] w-[44rem] -translate-x-1/2 translate-y-1/3 rounded-full bg-gold/25 blur-[130px]" />
      <div className="absolute -left-24 -top-16 h-[22rem] w-[22rem] rounded-full bg-gold/15 blur-[100px]" />
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
