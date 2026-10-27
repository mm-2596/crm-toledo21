"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { RotatingWord } from "./RotatingWord";

const SLIDE_DURATION = 6000;

// Fotos de la portada (carrusel a pantalla completa). Son imágenes ilustrativas del tipo de vida y de
// vivienda de Getafe y Madrid sur, no fichas concretas. Se ponen todas a la vez en la página y solo
// cambia cuál se ve, así la siguiente ya está cargada y no hay saltos. Con "reducir movimiento"
// activado no cambian solas ni se acercan.
const SLIDES = [
  { src: "/images/hero/hero-1-salon.jpg", alt: "Salón luminoso de un piso con balcón y muebles de madera" },
  { src: "/images/hero/hero-2-terraza.jpg", alt: "Terraza soleada de un piso con vistas a los edificios del barrio" },
  { src: "/images/hero/hero-3-calle.jpg", alt: "Calle tranquila y arbolada con comercios de barrio" },
  { src: "/images/hero/hero-4-parque.jpg", alt: "Familia paseando por un parque junto a edificios residenciales" },
  { src: "/images/hero/hero-5-llaves.jpg", alt: "Pareja entrando en su nuevo piso con las llaves en la mano" },
];

export function Hero() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), SLIDE_DURATION);
    return () => clearInterval(id);
  }, [reduceMotion, active]);

  return (
    <section id="hero" className="relative min-h-[640px] overflow-hidden bg-ink sm:min-h-[720px]">
      <div className="absolute inset-0">
        {SLIDES.map((slide, i) => (
          <motion.div
            key={slide.src}
            aria-hidden={i !== active}
            initial={false}
            animate={{ opacity: i === active ? 1 : 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <motion.div
              initial={false}
              animate={{ scale: i === active && !reduceMotion ? 1.08 : 1 }}
              transition={{ duration: i === active && !reduceMotion ? (SLIDE_DURATION * 1.4) / 1000 : 1.1, ease: "linear" }}
              className="absolute inset-0"
            >
              <Image src={slide.src} alt={i === active ? slide.alt : ""} fill sizes="100vw" quality={80} priority={i === 0} className="object-cover" />
            </motion.div>
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/10 to-transparent" />
      </div>

      <div className="relative flex min-h-[640px] flex-col px-6 py-16 sm:min-h-[720px] sm:px-10 sm:py-20">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center">
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
            className="mt-5 max-w-2xl font-display text-4xl leading-[1.05] text-paper sm:text-6xl"
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

        <div className="mx-auto flex w-full max-w-7xl justify-center gap-1.5 sm:justify-start" role="group" aria-label="Fotos de la portada">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              onClick={() => setActive(i)}
              aria-label={`Ver la foto ${i + 1} de ${SLIDES.length}`}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-gold" : "w-1.5 bg-paper/30 hover:bg-paper/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
