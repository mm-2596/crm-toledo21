"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { HandHeart, MapPinned, ShieldCheck, Sparkles } from "lucide-react";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Seguridad y confianza",
    description: "Más de 25 años de trayectoria nos sitúan entre las agencias más serias del sector.",
  },
  {
    icon: HandHeart,
    title: "Trato personalizado",
    description: "Cada persona recibe acompañamiento real de un agente, no un trámite genérico.",
  },
  {
    icon: Sparkles,
    title: "Claridad y transparencia",
    description: "Valoraciones honestas y sin letra pequeña: lo que necesitas saber, no lo que quieres oír.",
  },
  {
    icon: MapPinned,
    title: "Cercanía real",
    description: "Oficinas en Getafe y Leganés, con gestoría propia para resolver todo sin salir de casa.",
  },
];

export function AboutContent() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-28">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        >
          <h1 className="font-display text-3xl text-ink sm:text-4xl">La cara amable de tu inmobiliaria</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
            Desde 1997 acompañamos a quienes compran, venden o alquilan en Getafe y Madrid sur. Sin sorpresas,
            desde la primera visita hasta la entrega de llaves.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.6, delay: 0.1 }}
          className="relative aspect-[4/3] overflow-hidden rounded-3xl"
        >
          <Image
            src="/images/about/hero.jpg"
            alt="El equipo de Toledo21 revisando la documentación de una vivienda con un cliente"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </motion.div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          className="relative order-2 aspect-[4/3] overflow-hidden rounded-3xl lg:order-1"
        >
          <Image
            src="/images/about/team.jpg"
            alt="Equipo de Toledo21 celebrando un cierre de venta"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/0 to-transparent" />
          <p className="absolute inset-x-6 bottom-6 font-display text-lg leading-snug text-paper sm:text-xl">
            &ldquo;Lo que nos importa es que quien confía en nosotros esté tranquilo.&rdquo;
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.1 }}
          className="order-1 flex flex-col justify-center lg:order-2"
        >
          <h2 className="font-display text-2xl text-ink">Especialistas inmobiliarios</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Cuando vendes con nosotros, tu propiedad tiene un plan de difusión propio — no una ficha más entre
            miles — con valoraciones reales comparadas con el mercado. Al comprar, cada inmueble de la cartera
            tiene un agente real detrás, disponible en cada visita.
          </p>
        </motion.div>
      </div>

      <div className="mt-20">
        <h2 className="text-center font-display text-2xl text-ink">Nuestros valores</h2>
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
          {VALUES.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", bounce: 0, duration: 0.45, delay: Math.min(i * 0.08, 0.3) }}
              className="flex gap-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
                <value.icon size={19} />
              </span>
              <div>
                <h3 className="font-display text-lg text-ink">{value.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{value.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        className="mt-20 flex flex-col items-center gap-4 rounded-3xl bg-ink px-8 py-12 text-center sm:px-12"
      >
        <h2 className="max-w-xl font-display text-2xl text-paper sm:text-3xl">¿Hablamos de tu próximo paso?</h2>
        <p className="max-w-lg text-sm text-paper/70">
          Ven a conocernos en persona o consulta a nuestro equipo, sin compromiso.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/oficinas"
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.03]"
          >
            Ver nuestras oficinas
          </Link>
          <Link
            href="/equipo"
            className="rounded-full border border-paper/20 px-6 py-3 text-sm text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Conoce al equipo
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
