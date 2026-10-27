"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Bath, BedDouble, Maximize, MessageCircle, Phone } from "lucide-react";
import { PHONE_DISPLAY, PHONE_TEL, whatsappLink } from "@/lib/contact";

interface Props {
  /** Precio ya formateado. */
  price: string;
  title: string;
  place: string;
  reference: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
}

// Barra que se queda fija bajo el menú cuando el precio de la cabecera sale de la pantalla, para que
// llamar o escribir esté siempre a un toque mientras se mira la ficha.
export function PropertyStickyBar({ price, title, place, reference, bedrooms, bathrooms, areaM2 }: Props) {
  const [show, setShow] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const target = document.getElementById("ficha-precio");
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => {
      // Aparece cuando el precio ya quedó por encima de la pantalla (no antes de llegar a él).
      setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    }, { rootMargin: "-84px 0px 0px 0px" });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="fixed inset-x-0 top-[76px] z-40 px-3 sm:px-6"
          role="region"
          aria-label="Resumen de la propiedad"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 rounded-2xl border border-line/60 bg-paper/95 px-4 py-2.5 shadow-lg shadow-black/[0.08] backdrop-blur-xl sm:gap-5 sm:px-5">
            <div className="min-w-0 flex-1 sm:flex-none">
              <p className="font-display text-lg leading-none text-ink sm:text-xl">{price}</p>
              <p className="mt-1 truncate text-xs text-ink-soft sm:hidden">{place}</p>
            </div>

            <div className="hidden min-w-0 flex-1 border-l border-line pl-5 sm:block">
              <p className="truncate text-sm font-medium text-ink">{title}</p>
              <p className="truncate text-xs text-ink-soft">
                {place} · Ref. {reference}
              </p>
            </div>

            <div className="hidden items-center gap-4 border-l border-line pl-5 text-xs text-ink-soft md:flex">
              {bedrooms != null && (
                <span className="flex items-center gap-1" title="Habitaciones">
                  <BedDouble size={14} className="text-gold" /> {bedrooms}
                </span>
              )}
              {bathrooms != null && (
                <span className="flex items-center gap-1" title="Baños">
                  <Bath size={14} className="text-gold" /> {bathrooms}
                </span>
              )}
              {areaM2 != null && (
                <span className="flex items-center gap-1" title="Superficie">
                  <Maximize size={14} className="text-gold" /> {areaM2} m²
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={`tel:${PHONE_TEL}`}
                aria-label={`Llamar al ${PHONE_DISPLAY}`}
                className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-transform hover:scale-[1.03]"
              >
                <Phone size={14} aria-hidden="true" />
                <span className="hidden lg:inline">{PHONE_DISPLAY}</span>
                <span className="lg:hidden">Llamar</span>
              </a>
              <a
                href={whatsappLink(`Hola, me interesa la propiedad ${reference} (${title}).`)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Escribir por WhatsApp"
                className="hidden items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition-transform hover:scale-[1.03] sm:flex"
              >
                <MessageCircle size={14} aria-hidden="true" /> WhatsApp
              </a>
              <a
                href="#contactar"
                className="hidden rounded-full border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:bg-paper-dim md:block"
              >
                Me interesa
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
