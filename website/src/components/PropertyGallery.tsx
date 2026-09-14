"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, animate, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicImage } from "@/lib/types";

export function PropertyGallery({ images, title }: { images: PublicImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function measure() {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (reduceMotion || !width) return;
    const controls = animate(x, -active * width, { type: "spring", bounce: 0, duration: 0.4 });
    return controls.stop;
  }, [active, width, x, reduceMotion]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-paper-dim text-sm text-ink-soft">
        Sin fotografías todavía
      </div>
    );
  }

  function goTo(index: number) {
    setActive(Math.max(0, Math.min(images.length - 1, index)));
  }

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const threshold = width * 0.18;
    if (info.offset.x < -threshold || info.velocity.x < -500) {
      goTo(active + 1);
    } else if (info.offset.x > threshold || info.velocity.x > 500) {
      goTo(active - 1);
    } else {
      animate(x, -active * width, { type: "spring", bounce: 0, duration: 0.35 });
    }
  }

  return (
    <div>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0, duration: 0.6 }}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-paper-dim">
        {reduceMotion ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="absolute inset-0">
              <Image src={images[active].url} alt={title} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" priority />
            </motion.div>
          </AnimatePresence>
        ) : (
          width > 0 && (
            <motion.div
              className="flex h-full cursor-grab touch-pan-y active:cursor-grabbing"
              style={{ x, width: width * images.length }}
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: -(images.length - 1) * width, right: 0 }}
              dragElastic={0.2}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
            >
              {images.map((img, i) => (
                <div key={img.id} className="relative h-full shrink-0" style={{ width }}>
                  <Image
                    src={img.url}
                    alt={title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="pointer-events-none object-cover"
                    priority={i === 0}
                    draggable={false}
                  />
                </div>
              ))}
            </motion.div>
          )
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink backdrop-blur-sm hover:bg-paper disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => goTo(active + 1)}
              disabled={active === images.length - 1}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink backdrop-blur-sm hover:bg-paper disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs text-paper">
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </motion.div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <motion.button
              key={img.id}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
              onClick={() => goTo(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition-all ${
                i === active ? "ring-gold" : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
