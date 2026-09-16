"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

// TODO(contenido real pendiente): sustituir por reseñas reales de clientes
// (Google, encuestas post-venta, etc.) antes de dar esto por definitivo.
// Los nombres y textos de abajo son de relleno para maquetar la sección.
const TESTIMONIALS = [
  {
    name: "Marta S.",
    context: "Vendió un piso en Getafe",
    rating: 5,
    quote:
      "Nos explicaron desde el primer día cómo iba a ser el proceso y cumplieron los plazos que nos dijeron. Vendimos antes de lo que esperábamos.",
  },
  {
    name: "Javier R.",
    context: "Compró en Leganés",
    rating: 5,
    quote:
      "Se nota que conocen la zona. Nos enseñaron pisos que de verdad encajaban con lo que buscábamos, no lo primero que tenían en cartera.",
  },
  {
    name: "Almudena P.",
    context: "Alquiló un piso en Getafe",
    rating: 4,
    quote: "El trámite fue rápido y sin sorpresas de última hora. Siempre disponibles cuando tuve dudas con el contrato.",
  },
  {
    name: "Carlos M.",
    context: "Tramitó una herencia",
    rating: 5,
    quote:
      "Nos ayudaron con toda la parte de la gestoría además de la venta. Un solo interlocutor para todo, se agradece muchísimo.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="mx-auto max-w-xl font-display text-3xl text-ink sm:text-4xl">Lo que dicen quienes ya confiaron en nosotros</h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", bounce: 0, duration: 0.45, delay: Math.min(i * 0.08, 0.3) }}
            className={`flex flex-col gap-4 rounded-2xl p-6 ${i === 0 ? "bg-ink text-paper lg:col-span-2 lg:row-span-1" : "bg-paper-dim text-ink"}`}
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
            <p className={`flex-1 text-sm leading-relaxed ${i === 0 ? "text-paper/85" : "text-ink-soft"}`}>“{t.quote}”</p>
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
