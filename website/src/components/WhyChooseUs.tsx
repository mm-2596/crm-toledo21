import { Award, Banknote, FileCheck, Landmark, ScrollText, Scale } from "lucide-react";

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
  {
    icon: Landmark,
    title: "Desde 1997 en el sector",
    description: "Más de 25 años de trayectoria nos sitúan como una de las agencias más serias y cualificadas de la zona.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Compromiso real</p>
        <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl text-ink sm:text-4xl">¿Por qué elegirnos?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-ink-soft sm:text-base">
          No prometemos lo que no cumplimos. Esto es lo que incluye trabajar con nosotros, sin letra pequeña.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((reason) => (
          <div key={reason.title} className="rounded-2xl border border-line bg-paper p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-gold">
              <reason.icon size={18} />
            </span>
            <h3 className="mt-4 font-display text-lg text-ink">{reason.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{reason.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-ink px-8 py-10 text-center sm:px-12">
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Nuestro compromiso</p>
        <p className="max-w-2xl font-display text-2xl leading-snug text-paper sm:text-3xl">
          Si no vendemos tu casa en <span className="text-gold">12 semanas</span>, rescindimos el contrato.
        </p>
        <p className="max-w-xl text-sm text-paper/70">
          Te informamos constantemente de la evolución: visitas, objeciones, y revisión de estrategia en reuniones
          periódicas. Nuestra implicación con tu inmueble es máxima.
        </p>
      </div>
    </section>
  );
}
