"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useMotionValue,
  animate,
  type PanInfo,
} from "framer-motion";
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
    text: "Valoración gratuita y sin compromiso, basada en datos reales del mercado en Getafe y Madrid sur, no en estimaciones genéricas.",
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

          <div className="relative flex aspect-[4/3] max-h-full items-center justify-center overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-paper-dim to-paper">
            {/* Número fantasma: da escala y profundidad al fondo, sin competir con el icono. */}
            <AnimatePresence mode="wait">
              <motion.span
                key={active}
                initial={{ opacity: 0, x: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[220px] leading-none text-ink/[0.04]"
              >
                {String(active + 1).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>

            {!reduceMotion && (
              <>
                <motion.div
                  aria-hidden="true"
                  className="absolute h-44 w-44 rounded-full border border-gold/25"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  aria-hidden="true"
                  className="absolute h-64 w-64 rounded-full border border-dashed border-gold/15"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 64, repeat: Infinity, ease: "linear" }}
                />
              </>
            )}
            <div aria-hidden="true" className="absolute h-32 w-32 rounded-full bg-gold/25 blur-3xl" />

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.8, rotate: reduceMotion ? 0 : -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.8, rotate: reduceMotion ? 0 : 10 }}
                transition={{ type: "spring", bounce: 0.35, duration: 0.55 }}
                className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-paper shadow-lg shadow-black/10"
              >
                <Icon size={40} className="text-gold" strokeWidth={1.4} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// En móvil/tablet: carrusel deslizable con el dedo (en vez del scroll
// anclado de escritorio, que no cabe en una sola columna). Mismo patrón
// de arrastre que la galería de fotos, para que se sienta nativo y con
// movimiento real, sin el riesgo de desbordamiento del "sticky".
function ProcessShowcaseMobile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const CARD_GAP = 16;

  useEffect(() => {
    function measure() {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const cardWidth = width * 0.86;
  const step = cardWidth + CARD_GAP;

  useEffect(() => {
    if (!width) return;
    const controls = animate(x, -active * step, { type: "spring", bounce: 0, duration: 0.4 });
    return controls.stop;
  }, [active, step, width, x]);

  function goTo(i: number) {
    setActive(Math.max(0, Math.min(STEPS.length - 1, i)));
  }

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const threshold = step * 0.2;
    if (info.offset.x < -threshold || info.velocity.x < -400) goTo(active + 1);
    else if (info.offset.x > threshold || info.velocity.x > 400) goTo(active - 1);
    else animate(x, -active * step, { type: "spring", bounce: 0, duration: 0.35 });
  }

  return (
    <div className="lg:hidden">
      <div ref={containerRef} className="overflow-hidden pl-6">
        {width > 0 && (
          <motion.div
            className="flex cursor-grab touch-pan-y active:cursor-grabbing"
            style={{ x, gap: CARD_GAP }}
            drag={!reduceMotion && "x"}
            dragConstraints={{ left: -(STEPS.length - 1) * step, right: 0 }}
            dragElastic={0.15}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
          >
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  style={{ width: cardWidth }}
                  className="shrink-0 rounded-3xl border border-line bg-paper p-6"
                >
                  <motion.div
                    animate={{ y: reduceMotion ? 0 : [0, -6, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-dim text-gold"
                  >
                    <Icon size={22} strokeWidth={1.4} />
                  </motion.div>
                  <p className="mt-5 text-xs font-medium uppercase tracking-wider text-gold">
                    {String(i + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            onClick={() => goTo(i)}
            aria-label={`Ir a "${s.title}"`}
            className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-gold" : "w-1.5 bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}
