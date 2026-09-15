"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "toledo21-cookie-consent";

export type CookieConsent = "all" | "essential";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "all" || value === "essential" ? value : null;
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Se comprueba tras el montaje (no en el render) porque localStorage no
    // existe durante el renderizado en el servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!getCookieConsent()) setVisible(true);
  }, []);

  function choose(consent: CookieConsent) {
    try {
      localStorage.setItem(STORAGE_KEY, consent);
    } catch {
      // Si localStorage falla (modo privado), simplemente no se recuerda la
      // elección y se volverá a preguntar en la siguiente visita.
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-line bg-paper p-5 shadow-2xl shadow-black/10 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <p className="text-sm text-ink-soft">
            Usamos cookies técnicas necesarias para el funcionamiento del sitio. No usamos cookies de analítica ni
            publicidad todavía.{" "}
            <Link href="/cookies" className="text-ink underline underline-offset-2">
              Más información
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => choose("essential")}
              className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft hover:text-ink"
            >
              Solo esenciales
            </button>
            <button
              onClick={() => choose("all")}
              className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper hover:scale-[1.03] transition-transform"
            >
              Aceptar todas
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
