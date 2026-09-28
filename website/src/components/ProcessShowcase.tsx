"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, animate, useMotionValue, type PanInfo } from "framer-motion";

const STEPS = [
  {
    title: "Búsqueda personalizada",
    text: "Filtramos por zona, presupuesto y lo que de verdad te importa.",
    image: "/images/process/busqueda.jpg",
    alt: "Una agente enseña opciones de vivienda en una tablet a dos clientes",
  },
  {
    title: "Tasación de tu vivienda",
    text: "Gratuita y con datos reales del mercado en Getafe y Madrid sur.",
    image: "/images/process/tasacion.jpg",
    alt: "Una agente inmobiliaria evalúa una vivienda con una carpeta en mano",
  },
  {
    title: "Acompañamiento en la compraventa",
    text: "Visitas, papeleo y negociación con un agente asignado a tu caso.",
    image: "/images/process/acompanamiento.jpg",
    alt: "Un agente entrega las llaves a una pareja de clientes tras firmar",
  },
  {
    title: "Asesoría de inversión",
    text: "Oportunidades de alquiler o reventa con mejor recorrido en la zona.",
    image: "/images/process/inversion.jpg",
    alt: "Una mano coloca monedas junto a maquetas de casas de madera",
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

// En pantallas anchas: pestañas + foto grande, cambio al pulsar (sin scroll
// encadenado — la versión anterior exigía 340vh de scroll para ver los 4
// pasos, lo que se sentía lento y escondía contenido).
function ProcessShowcaseDesktop() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto hidden max-w-5xl px-6 lg:block">
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-4">
        {STEPS.map((step, i) => (
          <button
            key={step.title}
            onClick={() => setActive(i)}
            className={`text-left text-sm font-medium transition-colors ${
              i === active ? "text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {step.title}
          </button>
        ))}
      </div>

      <div className="relative h-0.5 w-full bg-line">
        <motion.div
          key={active}
          className="absolute inset-y-0 left-0 origin-left bg-gold"
          initial={{ width: "0%" }}
          animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
        />
      </div>

      <div className="mt-10 grid grid-cols-2 items-center gap-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gold">
              {String(active + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </p>
            <h3 className="mt-3 font-display text-3xl text-ink">{STEPS[active].title}</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">{STEPS[active].text}</p>
          </motion.div>
        </AnimatePresence>

        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={STEPS[active].image}
                alt={STEPS[active].alt}
                fill
                sizes="(max-width: 1024px) 0px, 45vw"
                className="object-cover"
                priority={active === 0}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// En móvil/tablet: carrusel deslizable con el dedo.
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
            {STEPS.map((s, i) => (
              <div key={s.title} style={{ width: cardWidth }} className="shrink-0 overflow-hidden rounded-3xl border border-line bg-paper">
                <div className="relative aspect-[4/3]">
                  <Image src={s.image} alt={s.alt} fill sizes="86vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-gold">
                    {String(i + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </div>
            ))}
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
