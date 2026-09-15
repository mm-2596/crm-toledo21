"use client";

import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";

// Fondo fotográfico del hero: una foto real (no ilustración) con un lento
// zoom ligado al propio scroll — cuanto más bajas, más se acerca la imagen,
// mientras el hero permanece fijo en pantalla (ver Hero.tsx). El movimiento
// lo protagoniza el scroll, no un temporizador de carga.
export function HeroBackground({ scale }: { scale: MotionValue<number> }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      <motion.div style={{ scale }} className="absolute inset-0">
        <Image
          src="/hero/hero-building.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      {/* Tinte de marca: desatura y calienta la foto para que combine con el
          dorado en vez de competir con sus propios colores. */}
      <div className="absolute inset-0 bg-ink/55 [mix-blend-mode:multiply]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-ink/30" />
    </div>
  );
}
