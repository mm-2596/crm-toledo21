"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Search, Calculator, Handshake, TrendingUp, type LucideIcon } from "lucide-react";

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Search,
    title: "Búsqueda personalizada",
    text: "Te ayudamos a encontrar la propiedad que encaja con lo que buscas de verdad, filtrando por zona, presupuesto y características reales — no solo por precio.",
  },
  {
    icon: Calculator,
    title: "Tasación de tu vivienda",
    text: "Valoración gratuita y sin compromiso, basada en datos reales del mercado en Toledo y alrededores, no en estimaciones genéricas.",
  },
  {
    icon: Handshake,
    title: "Acompañamiento en la compraventa",
    text: "Gestionamos visitas, papeleo y negociación de principio a fin, con un agente Toledo21 asignado a tu caso en todo momento.",
  },
  {
    icon: TrendingUp,
    title: "Asesoría de inversión",
    text: "Identificamos oportunidades de alquiler o reventa con el mejor recorrido en la zona, apoyándonos en el histórico real de nuestra cartera.",
  },
];

export function ProcessShowcase() {
  return (
    <>
      <ProcessShowcaseDesktop />
      <ProcessShowcaseMobile />
    </>
  );
}

// En pantallas anchas: barra de pestañas anclada + progreso de scroll.
// Confinado a lg+ porque en columna única (móvil) el texto y el panel
// visual apilados necesitan más alto de lo que cabe en el contenedor
// "sticky", y el sobrante se desbordaba encima de la siguiente sección.
function ProcessShowcaseDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
    setActive(idx);
  });

  function goTo(i: number) {
    const el = containerRef.current;
    if (!el) return;
    const segment = el.offsetHeight / STEPS.length;
    const top = el.offsetTop + segment * i + 8;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  const Icon = STEPS[active].icon;

  return (
    <div ref={containerRef} style={{ height: `${STEPS.length * 85}vh` }} className="relative hidden lg:block">
      <div className="sticky top-28 mx-auto flex max-w-5xl flex-col px-6" style={{ height: "min(560px, 78vh)" }}>
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-4">
          {STEPS.map((step, i) => (
            <button
              key={step.title}
              onClick={() => goTo(i)}
              className={`text-left text-sm font-medium transition-colors ${
                i === active ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        <div className="h-0.5 w-full bg-line">
          <motion.div className="h-full origin-left bg-gold" style={{ scaleX: scrollYProgress }} />
        </div>

        <div className="mt-10 grid flex-1 grid-cols-2 items-center gap-10 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -16 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-gold">
                {String(active + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-3xl text-ink">{STEPS[active].title}</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">{STEPS[active].text}</p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex aspect-[4/3] max-h-full items-center justify-center rounded-3xl bg-paper-dim"
            >
              <Icon size={64} className="text-gold" strokeWidth={1.2} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// En móvil/tablet: lista simple apilada, sin scroll anclado (evita el
// riesgo de desbordamiento del patrón "sticky" en columna única).
function ProcessShowcaseMobile() {
  return (
    <div className="mx-auto max-w-xl px-6 lg:hidden">
      <div className="flex flex-col divide-y divide-line border-y border-line">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex gap-4 py-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-paper-dim text-gold">
                <Icon size={22} strokeWidth={1.4} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gold">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-display text-lg text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
