"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, BedDouble, Bath, Maximize, ArrowRight } from "lucide-react";
import { RotatingWord } from "./RotatingWord";
import { formatCurrency, listingTypeLabels } from "@/lib/format";
import type { PublicProperty } from "@/lib/types";

const SLIDE_DURATION = 6000;

interface Slide {
  id: string;
  image: string;
  property: PublicProperty;
}

// Fondo a pantalla completa con fotos reales de la cartera (no un render
// genérico): cada inmueble con foto entra en el carrusel, con un zoom lento
// tipo "Ken Burns" para que el hero se sienta vivo sin ser un vídeo de stock.
export function Hero({ properties = [] }: { properties?: PublicProperty[] }) {
  const slides: Slide[] = useMemo(
    () =>
      properties
        .filter((p) => p.images[0]?.url)
        .map((p) => ({ id: p.id, image: p.images[0].url, property: p })),
    [properties],
  );

  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (slides.length < 2 || reduceMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % slides.length), SLIDE_DURATION);
    return () => clearInterval(id);
  }, [slides.length, reduceMotion]);

  const current = slides[active];

  return (
    <section id="hero" className="relative min-h-[640px] overflow-hidden bg-ink sm:min-h-[720px]">
      <div className="absolute inset-0">
        {slides.length > 0 ? (
          <AnimatePresence initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: reduceMotion ? 1 : 1.09 }}
                transition={{ duration: (SLIDE_DURATION * 1.4) / 1000, ease: "linear" }}
                className="absolute inset-0"
              >
                <Image
                  src={current.image}
                  alt={current.property.title}
                  fill
                  sizes="100vw"
                  priority
                  className="object-cover"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-[#1c1815] to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/10 to-transparent" />
      </div>

      {/* En escritorio hay hueco de sobra a la derecha de la foto (ya no hay
          nada del render con lo que chocar), así que la ficha destacada vuelve
          arriba a la derecha, como al principio. En móvil no cabe al lado del
          titular, así que se queda debajo del texto, en el flujo normal. */}
      {slides.length > 0 && (
        <div className="pointer-events-none absolute inset-x-6 top-24 hidden justify-end lg:inset-x-10 lg:top-28 lg:flex">
          <div className="pointer-events-auto flex flex-col items-end gap-3">
            <SpotlightCard property={current.property} />
            {slides.length > 1 && (
              <div className="flex gap-1.5 pr-1">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(i)}
                    aria-label={`Ver ${s.property.title}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active ? "w-6 bg-gold" : "w-1.5 bg-paper/30 hover:bg-paper/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

        {slides.length > 0 && (
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-5 lg:hidden">
            <SpotlightCard property={current.property} className="w-full max-w-sm" />
            {slides.length > 1 && (
              <div className="flex gap-1.5 self-center">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(i)}
                    aria-label={`Ver ${s.property.title}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active ? "w-6 bg-gold" : "w-1.5 bg-paper/30 hover:bg-paper/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SpotlightCard({ property, className = "" }: { property: PublicProperty; className?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={property.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={`w-full max-w-xs rounded-2xl border border-paper/15 bg-ink/50 p-4 text-paper shadow-2xl shadow-black/40 backdrop-blur-xl ${className}`}
      >
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Destacado · {listingTypeLabels[property.listingType]}
        </div>
        <h3 className="mt-1.5 font-display text-base leading-tight text-paper sm:text-lg">{property.title}</h3>
        <p className="mt-1 text-xs text-paper/60">{property.zone || property.city}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-paper/70">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble size={13} /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath size={13} /> {property.bathrooms}
            </span>
          )}
          {property.areaM2 != null && (
            <span className="flex items-center gap-1">
              <Maximize size={13} /> {property.areaM2} m²
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-paper/10 pt-3">
          <p className="font-display text-lg text-paper">{formatCurrency(property.price)}</p>
          <Link
            href={`/propiedades/${property.id}`}
            className="group flex items-center gap-1 text-xs font-medium text-gold"
          >
            Ver ficha
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
