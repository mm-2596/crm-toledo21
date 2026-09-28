"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Pause, Play } from "lucide-react";

// Vídeo de stock (genérico, no un barrio real de Getafe): ilustra la idea de
// "calidad de vida" sin decir que esa toma concreta es la zona. Con
// prefers-reduced-motion no se reproduce solo: hace falta pulsar play.
export function LifestyleVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(!reduceMotion);

  // El atributo autoPlay no siempre arranca por sí solo (varía según
  // navegador y momento de la hidratación); pedirlo explícitamente en
  // cuanto el vídeo existe es lo que de verdad garantiza el autoplay.
  useEffect(() => {
    if (reduceMotion) return;
    videoRef.current?.play().catch(() => setPlaying(false));
  }, [reduceMotion]);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-ink sm:aspect-[21/9]">
        <video
          ref={videoRef}
          src="/video/lifestyle.mp4"
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="max-w-lg"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gold">Calidad de vida</p>
            <h2 className="mt-2 font-display text-2xl leading-snug text-paper sm:text-4xl">
              Un barrio donde de verdad se puede vivir
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/75 sm:text-base">
              Calles tranquilas, zonas verdes y todo a mano — así son los barrios de Getafe y Madrid sur donde
              trabajamos cada día.
            </p>
            <Link
              href="/propiedades"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.03]"
            >
              Ver propiedades disponibles
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        <button
          onClick={toggle}
          aria-label={playing ? "Pausar vídeo" : "Reproducir vídeo"}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-paper/20 bg-ink/50 text-paper backdrop-blur-sm transition-colors hover:bg-ink/70"
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
      </div>
    </section>
  );
}
