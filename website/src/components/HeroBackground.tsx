"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, type MotionValue } from "framer-motion";

// El hero se queda fijo en pantalla mientras se hace scroll (ver Hero.tsx),
// y ese mismo scroll controla un zoom lento sobre este fondo — por eso
// AuroraMesh y CitySkyline van dentro de un contenedor con la `scale` que
// llega por prop, mientras las partículas y el degradado quedan fuera para
// no acercarse con el zoom.
export function HeroBackground({ scale }: { scale: MotionValue<number> }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      <motion.div style={{ scale }} className="absolute inset-0">
        <AuroraMesh />
        <CitySkyline />
      </motion.div>
      <FloatingParticles />
      <LightSweep />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
    </div>
  );
}

function AuroraMesh() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="absolute inset-0 [mix-blend-mode:screen]">
      <motion.div
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(169,131,79,0.45), transparent 18%, transparent 45%, rgba(169,131,79,0.32), transparent 75%, rgba(237,227,209,0.18), transparent 95%)",
        }}
      />
      <motion.div
        animate={reduceMotion ? undefined : { x: [0, 130, -70, 0], y: [0, -90, 60, 0], scale: [1, 1.3, 0.85, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-24 -top-16 h-[26rem] w-[26rem] rounded-full bg-gold/50 blur-[85px]"
      />
      <motion.div
        animate={reduceMotion ? undefined : { x: [0, -110, 90, 0], y: [0, 100, -60, 0], scale: [1, 0.85, 1.2, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-6rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-gold/35 blur-[95px]"
      />
      <motion.div
        animate={reduceMotion ? undefined : { x: [0, 80, -90, 0], y: [0, -60, 50, 0], scale: [1, 1.15, 0.9, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-paper/25 blur-[90px]"
      />
      {/* Resplandor central, tipo amanecer, detrás de las torres más altas del skyline */}
      <motion.div
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/2 h-[22rem] w-[40rem] -translate-x-1/2 rounded-full bg-gold/25 blur-[120px]"
      />
    </div>
  );
}

// Capa lejana: torres más altas y espaciadas, más tenues y desenfocadas, dan
// sensación de profundidad y de skyline "monumental" detrás del principal.
const SKYLINE_FAR: [number, number][] = [
  [0, 340], [40, 340], [40, 260], [90, 260], [90, 180], [130, 180], [130, 90], [160, 40], [190, 90], [190, 210],
  [250, 210], [250, 150], [300, 150], [300, 260], [370, 260], [370, 200], [420, 200], [420, 300], [500, 300],
  [500, 120], [540, 60], [580, 120], [580, 280], [660, 280], [660, 230], [720, 230], [720, 320], [800, 320],
  [800, 180], [850, 180], [850, 250], [920, 250], [920, 100], [960, 40], [1000, 100], [1000, 300], [1080, 300],
  [1080, 240], [1140, 240], [1140, 330], [1220, 330], [1220, 200], [1280, 200], [1280, 340], [1440, 340],
];

// Capa cercana: más densa e irregular, en primer plano, con trazo dorado
// nítido — es la que ya existía, ligeramente ampliada.
const SKYLINE_NEAR: [number, number][] = [
  [0, 230], [60, 230], [60, 180], [110, 180], [110, 140], [140, 140], [140, 100], [165, 100],
  [165, 60], [182, 10], [199, 60], [224, 60], [224, 120], [270, 120], [270, 170], [330, 170], [330, 110],
  [360, 110], [360, 70], [395, 70], [395, 30], [412, 5], [429, 30], [429, 70], [429, 95],
  [450, 95], [450, 80], [470, 80], [470, 95], [490, 95], [490, 80], [510, 80], [510, 95],
  [530, 95], [530, 80], [550, 80], [550, 95], [570, 95], [570, 70], [587, 70], [604, 5], [621, 70], [638, 70],
  [638, 110], [690, 110], [690, 190], [740, 190], [740, 150], [780, 150], [780, 210], [850, 210], [850, 170],
  [900, 170], [900, 240], [980, 240], [980, 200], [1030, 200], [1030, 260], [1440, 260],
];

function buildPaths(points: [number, number][], baseline: number) {
  const outlineD = `M0,${points[0][1]} ${points.slice(1).map(([x, y]) => `L${x},${y}`).join(" ")}`;
  const fillD = `${outlineD} L1440,${baseline} L0,${baseline} Z`;
  return { outlineD, fillD };
}

function CitySkyline() {
  const reduceMotion = useReducedMotion();
  const far = useMemo(() => buildPaths(SKYLINE_FAR, 400), []);
  const near = useMemo(() => buildPaths(SKYLINE_NEAR, 300), []);

  return (
    <div className="absolute inset-0">
      <motion.svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-full w-full opacity-50 blur-[1.5px]"
        animate={reduceMotion ? undefined : { x: [0, -18, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="skylineFarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(169,131,79,0.1)" />
            <stop offset="100%" stopColor="rgba(20,17,15,0.9)" />
          </linearGradient>
        </defs>
        <motion.path
          d={far.fillD}
          fill="url(#skylineFarFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6 }}
        />
        <motion.path
          d={far.outlineD}
          fill="none"
          stroke="#c9a06a"
          strokeWidth={1.5}
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: 3, ease: "easeInOut" }, opacity: { duration: 0.4 } }}
        />
      </motion.svg>

      <svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[78%] w-full"
        style={{ filter: "drop-shadow(0 0 22px rgba(169,131,79,0.4))" }}
      >
        <defs>
          <linearGradient id="skylineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(169,131,79,0.18)" />
            <stop offset="100%" stopColor="rgba(20,17,15,0.97)" />
          </linearGradient>
        </defs>
        <motion.path
          d={near.fillD}
          fill="url(#skylineFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.4 }}
        />
        <motion.path
          d={near.outlineD}
          fill="none"
          stroke="#c9a06a"
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: 2.6, ease: "easeInOut", delay: 0.15 }, opacity: { duration: 0.4, delay: 0.15 } }}
        />
      </svg>
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

function LightSweep() {
  return (
    <motion.div
      initial={{ x: "-40%" }}
      animate={{ x: "140%" }}
      transition={{ duration: 7, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
      className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-paper/10 to-transparent"
    />
  );
}
