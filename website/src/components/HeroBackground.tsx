"use client";

import { useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const SLIDE_DURATION = 6000;

export function HeroBackground({ images, active = 0 }: { images: string[]; active?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      {images.length > 0 ? (
        <AnimatePresence>
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: SLIDE_DURATION / 1000 + 1.2, ease: "linear" },
            }}
            className="absolute inset-0"
          >
            <Image src={images[active]} alt="" fill priority sizes="100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          <AuroraMesh />
          <CitySkyline />
        </>
      )}

      <FloatingParticles />
      <LightSweep />

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
    </div>
  );
}

function AuroraMesh() {
  return (
    <div className="absolute inset-0 [mix-blend-mode:screen]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(169,131,79,0.4), transparent 18%, transparent 45%, rgba(169,131,79,0.28), transparent 75%, rgba(237,227,209,0.15), transparent 95%)",
        }}
      />
      <motion.div
        animate={{ x: [0, 130, -70, 0], y: [0, -90, 60, 0], scale: [1, 1.3, 0.85, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-24 -top-16 h-[26rem] w-[26rem] rounded-full bg-gold/50 blur-[85px]"
      />
      <motion.div
        animate={{ x: [0, -110, 90, 0], y: [0, 100, -60, 0], scale: [1, 0.85, 1.2, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-6rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-gold/35 blur-[95px]"
      />
      <motion.div
        animate={{ x: [0, 80, -90, 0], y: [0, -60, 50, 0], scale: [1, 1.15, 0.9, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-paper/25 blur-[90px]"
      />
    </div>
  );
}

const SKYLINE_TOP: [number, number][] = [
  [0, 230], [60, 230], [60, 180], [110, 180], [110, 140], [140, 140], [140, 100], [165, 100],
  [165, 60], [182, 20], [199, 60], [224, 60], [224, 120], [270, 120], [270, 170], [330, 170], [330, 110],
  [360, 110], [360, 70], [395, 70], [395, 40], [412, 20], [429, 40], [429, 70], [429, 95],
  [450, 95], [450, 80], [470, 80], [470, 95], [490, 95], [490, 80], [510, 80], [510, 95],
  [530, 95], [530, 80], [550, 80], [550, 95], [570, 95], [570, 70], [587, 70], [604, 20], [621, 70], [638, 70],
  [638, 110], [690, 110], [690, 190], [740, 190], [740, 150], [780, 150], [780, 210], [850, 210], [850, 170],
  [900, 170], [900, 240], [980, 240], [980, 200], [1030, 200], [1030, 260], [1440, 260],
];

function CitySkyline() {
  const outlineD = useMemo(
    () => `M0,230 ${SKYLINE_TOP.slice(1).map(([x, y]) => `L${x},${y}`).join(" ")}`,
    [],
  );
  const fillD = useMemo(() => `${outlineD} L1440,300 L0,300 Z`, [outlineD]);

  return (
    <svg
      viewBox="0 0 1440 300"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full opacity-90"
      style={{ filter: "drop-shadow(0 0 18px rgba(169,131,79,0.35))" }}
    >
      <defs>
        <linearGradient id="skylineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(169,131,79,0.16)" />
          <stop offset="100%" stopColor="rgba(20,17,15,0.95)" />
        </linearGradient>
      </defs>
      <motion.path
        d={fillD}
        fill="url(#skylineFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.4 }}
      />
      <motion.path
        d={outlineD}
        fill="none"
        stroke="#c9a06a"
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 2.6, ease: "easeInOut", delay: 0.15 }, opacity: { duration: 0.4, delay: 0.15 } }}
      />
    </svg>
  );
}

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        size: 2 + ((i * 13) % 4),
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
