"use client";

import { motion, useReducedMotion } from "framer-motion";

const PHONE = "34711550732";
const MESSAGE = "Hola, estoy interesado/a en una propiedad de Toledo21.";

export function WhatsAppButton() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href={`https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.25, duration: 0.5, delay: 0.6 }}
      whileHover={{ scale: 1.06 }}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 sm:bottom-6 sm:right-6"
    >
      {!reduceMotion && (
        <motion.span
          animate={{ scale: [1, 1.8], opacity: [0.45, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-[#25D366]"
        />
      )}
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" className="relative">
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.386.7 4.61 1.91 6.47L4.5 29l7.72-1.87A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.98 16.72c-.3.83-1.7 1.6-2.34 1.68-.6.08-1.36.11-2.2-.14-.5-.15-1.15-.37-1.98-.72-3.48-1.5-5.76-4.99-5.93-5.22-.17-.23-1.42-1.9-1.42-3.62 0-1.73.9-2.57 1.22-2.92.32-.35.7-.44.94-.44.24 0 .47 0 .68.01.22.01.5-.08.79.6.3.7 1 2.43 1.09 2.6.09.18.15.39.03.62-.12.24-.18.39-.36.6-.18.21-.38.47-.54.63-.18.18-.37.37-.16.73.21.36.94 1.55 2.02 2.51 1.39 1.24 2.56 1.62 2.92 1.8.36.18.57.15.78-.09.21-.24.9-1.05 1.14-1.41.24-.36.48-.3.8-.18.32.12 2.05.97 2.4 1.14.36.18.6.27.68.42.09.15.09.86-.21 1.7Z" />
      </svg>
    </motion.a>
  );
}
