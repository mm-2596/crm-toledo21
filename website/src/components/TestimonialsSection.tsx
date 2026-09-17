"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

// Reseñas reales, copiadas de la ficha pública de Toledo21 - SomosTuInmobiliaria
// en Google Maps (4,2★, 144 reseñas) — no editar el contenido de las citas.
const GOOGLE_URL =
  "https://www.google.com/maps/place/Toledo21+-+SomosTuInmobiliaria+-+Getafe,+C.+Toledo,+21,+28901+Getafe,+Madrid/@40.3034017,-3.7327946,15z";

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

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="mx-auto max-w-xl font-display text-3xl text-ink sm:text-4xl">Lo que dicen quienes ya confiaron en nosotros</h2>
        <a
          href={GOOGLE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, s) => (
              <Star key={s} size={13} className={s < 4 ? "fill-gold text-gold" : "fill-gold/40 text-gold/40"} />
            ))}
          </span>
          4,2 en Google · 144 reseñas
        </a>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", bounce: 0, duration: 0.45, delay: Math.min(i * 0.08, 0.3) }}
            className={`flex flex-col gap-4 rounded-2xl p-6 ${i === 0 ? "bg-ink text-paper lg:col-span-2" : "bg-paper-dim text-ink"}`}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, s) => (
                <Star
                  key={s}
                  size={14}
                  className={s < t.rating ? "fill-gold text-gold" : i === 0 ? "text-paper/20" : "text-line"}
                />
              ))}
            </div>
            <p className={`flex-1 text-sm leading-relaxed ${i === 0 ? "text-paper/85" : "text-ink-soft"}`}>&ldquo;{t.quote}&rdquo;</p>
            <div>
              <p className={`text-sm font-medium ${i === 0 ? "text-paper" : "text-ink"}`}>{t.name}</p>
              <p className={`text-xs ${i === 0 ? "text-paper/60" : "text-ink-soft/70"}`}>{t.context}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
