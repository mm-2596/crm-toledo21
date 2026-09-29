"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

// Reseñas reales, copiadas de la ficha pública de Toledo21 - SomosTuInmobiliaria
// en Google Maps (4,2★, 144 reseñas) — no editar el contenido de las citas,
// y no ponerles ninguna foto: son personas reales que no conocemos, así que
// solo se identifican con sus iniciales, nunca con una cara inventada.
const GOOGLE_URL =
  "https://www.google.com/maps/place/Toledo21+-+SomosTuInmobiliaria+-+Getafe,+C.+Toledo,+21,+28901+Getafe,+Madrid/@40.3034017,-3.7327946,15z";

const AUTOPLAY_MS = 6000;

const AVATAR_COLORS = ["bg-gold text-ink", "bg-ink text-gold", "bg-paper-dim text-ink border border-line"];

const TESTIMONIALS = [
  {
    name: "Lore G.",
    context: "Vendió un piso en Getafe",
    rating: 5,
    quote:
      "Quiero agradecer a Fao por su excelente trabajo en la venta de nuestro piso. Desde el primer momento demostró gran profesionalidad, compromiso y una implicación total en todo el proceso. Nos explicó cada paso de forma clara y transparente, resolviendo todas nuestras dudas y estando siempre disponible cuando la necesitábamos.",
  },
  {
    name: "Hilianova L.",
    context: "Alquiló un piso en Getafe",
    rating: 5,
    quote:
      "Es una chica muy atenta, simpática, amable. Es muy ágil y eficiente haciendo su trabajo. Hemos alquilado un piso precioso en Getafe, gracias a ella, y estamos súper contentos. Un 10/10!",
  },
  {
    name: "Marilo L.",
    context: "Vendió un piso en Getafe",
    rating: 5,
    quote:
      "No puedo estar más agradecida con Fao y con el excelente trabajo que ha realizado. Desde el primer momento demostró una gran profesionalidad, cercanía y una paciencia infinita.",
  },
  {
    name: "Fabiola E.",
    context: "Cliente de Toledo21",
    rating: 5,
    quote:
      "Desde el primer momento fue una persona cercana, profesional y muy atenta a nuestras necesidades y preferencias.",
  },
  {
    name: "Eva P.",
    context: "Cliente de Toledo21",
    rating: 5,
    quote: "Un trato cercano, amable y muy profesional desde el primer momento.",
  },
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function GoogleG({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9.1h11.9c-.5 2.8-2.1 5.1-4.4 6.7v5.6h7.1c4.2-3.9 6.5-9.6 6.5-16.8z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.6c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.5C3 17 2 20.4 2 24s1 7 4.5 9.9z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
    </svg>
  );
}

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);

  function go(next: number, dir: number) {
    setDirection(dir);
    setActive((next + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = setInterval(() => go(active + 1, 1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [active, reduceMotion, paused]);

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.x < -60) go(active + 1, 1);
    else if (info.offset.x > 60) go(active - 1, -1);
  }

  const t = TESTIMONIALS[active];

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="mx-auto max-w-xl font-display text-3xl text-ink sm:text-4xl">
          Lo que dicen quienes ya confiaron en nosotros
        </h2>
        <a
          href={GOOGLE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          <GoogleG />
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, s) => (
              <Star key={s} size={13} className={s < 4 ? "fill-gold text-gold" : "fill-gold/40 text-gold/40"} />
            ))}
          </span>
          4,2 en Google · 144 reseñas
        </a>
      </div>

      <div
        className="relative mx-auto mt-12 max-w-2xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={active}
              custom={direction}
              drag={reduceMotion ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 40 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduceMotion ? 0 : -40 * direction }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="cursor-grab rounded-3xl border border-line bg-paper-dim p-8 active:cursor-grabbing sm:p-10"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, s) => (
                  <Star key={s} size={15} className={s < t.rating ? "fill-gold text-gold" : "text-line"} />
                ))}
              </div>
              <p className="mt-4 min-h-[6rem] text-base leading-relaxed text-ink-soft sm:text-lg">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm ${AVATAR_COLORS[active % AVATAR_COLORS.length]}`}
                >
                  {initialsOf(t.name)}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-ink-soft/70">{t.context}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => go(active - 1, -1)}
          aria-label="Reseña anterior"
          className="absolute left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper p-2.5 text-ink-soft shadow-md transition-colors hover:text-ink sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => go(active + 1, 1)}
          aria-label="Siguiente reseña"
          className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-line bg-paper p-2.5 text-ink-soft shadow-md transition-colors hover:text-ink sm:flex"
        >
          <ChevronRight size={18} />
        </button>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          {TESTIMONIALS.map((item, i) => (
            <button
              key={item.name}
              onClick={() => go(i, i > active ? 1 : -1)}
              aria-label={`Ver la reseña de ${item.name}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-gold" : "w-1.5 bg-line hover:bg-ink-soft/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
