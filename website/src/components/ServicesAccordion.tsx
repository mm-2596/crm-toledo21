"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

const SERVICES = [
  {
    title: "Búsqueda personalizada",
    text: "Te ayudamos a encontrar la propiedad que encaja con lo que buscas de verdad, filtrando por zona, presupuesto y características reales — no solo por precio.",
  },
  {
    title: "Tasación de tu vivienda",
    text: "Valoración gratuita y sin compromiso, basada en datos reales del mercado en Toledo y alrededores, no en estimaciones genéricas.",
  },
  {
    title: "Acompañamiento en la compraventa",
    text: "Gestionamos visitas, papeleo y negociación de principio a fin, con un agente Toledo21 asignado a tu caso en todo momento.",
  },
  {
    title: "Asesoría de inversión",
    text: "Identificamos oportunidades de alquiler o reventa con el mejor recorrido en la zona, apoyándonos en el histórico real de nuestra cartera.",
  },
];

export function ServicesAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-3xl">
      {SERVICES.map((service, i) => {
        const isOpen = open === i;
        return (
          <div key={service.title} className="border-b border-line first:border-t">
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              <span className="flex items-center gap-6">
                <span className={`font-display text-lg transition-colors ${isOpen ? "text-ink" : "text-ink-soft"}`}>
                  {service.title}
                </span>
              </span>
              <span className="flex items-center gap-4 shrink-0">
                <span className="font-display text-lg text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-dim text-ink-soft"
                >
                  <Plus size={14} />
                </motion.span>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="max-w-xl pb-6 text-sm leading-relaxed text-ink-soft">{service.text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
