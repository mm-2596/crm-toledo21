import { Award, Banknote, FileCheck, ScrollText, Scale } from "lucide-react";
import { YearsBanner } from "./YearsBanner";

const REASONS = [
  {
    icon: Award,
    title: "Valoración 100% gratuita",
    description:
      "La comparamos con el mercado y con ventas de inmuebles similares en la zona. Ni el precio más alto, ni el más bajo: el real.",
  },
  {
    icon: FileCheck,
    title: "Certificado energético gratis",
    description: "Obligatorio para vender o alquilar. Nos ocupamos de tramitarlo sin coste para ti.",
  },
  {
    icon: Scale,
    title: "Asesoría fiscal y jurídica gratuita",
    description:
      "Hacemos tu declaración de la renta y presentamos la plusvalía sin coste adicional, con acompañamiento legal en todo el proceso.",
  },
  {
    icon: Banknote,
    title: "Te conseguimos el 100% de la financiación",
    description: "Asesoramiento financiero gratuito para que comprar tu vivienda no dependa solo de tus ahorros.",
  },
  {
    icon: ScrollText,
    title: "Herencias tramitadas gratis",
    description: "Si heredas un inmueble y decides venderlo con nosotros, te gestionamos toda la tramitación sin coste.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="mx-auto max-w-xl font-display text-3xl text-ink sm:text-4xl">¿Por qué elegirnos?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-ink-soft sm:text-base">
          No prometemos lo que no cumplimos. Esto es lo que incluye trabajar con nosotros, sin letra pequeña.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
        {REASONS.map((reason) => (
          <div key={reason.title} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
              <reason.icon size={19} />
            </span>
            <div>
              <h3 className="font-display text-lg text-ink">{reason.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{reason.description}</p>
            </div>
          </div>
        ))}
      </div>

      <YearsBanner />
    </section>
  );
}
