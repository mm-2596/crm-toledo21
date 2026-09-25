import type { Metadata } from "next";
import { Clock, FileCheck, LineChart, ShieldCheck } from "lucide-react";
import { ValuationWizard } from "@/components/ValuationWizard";

export const metadata: Metadata = {
  title: "Tasación gratuita",
  description:
    "Tasa tu vivienda gratis y sin compromiso. Un agente de Toledo21 la valora con datos reales de Getafe y Madrid sur y te responde en menos de 24 horas.",
};

const BENEFITS = [
  {
    icon: LineChart,
    title: "Con datos reales de la zona",
    text: "Comparamos con inmuebles similares vendidos en tu zona. Ni el precio más alto, ni el más bajo: el real.",
  },
  { icon: Clock, title: "Respuesta en menos de 24 horas", text: "Un agente estudia tu caso y te contacta enseguida." },
  { icon: ShieldCheck, title: "Gratis y sin compromiso", text: "Conocer el valor de tu vivienda no te obliga a nada." },
  {
    icon: FileCheck,
    title: "Si vendes con nosotros, todo incluido",
    text: "Certificado energético, asesoría fiscal y jurídica y financiación, sin coste adicional.",
  },
];

export default function TasacionPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">Vende con tranquilidad</p>
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">Tasación gratuita de tu vivienda</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
            En 4 sencillos pasos, recibe una valoración de nuestros asesores en menos de 24 horas. Desde 1997 en
            Getafe y Madrid sur.
          </p>

          <ul className="mt-10 flex flex-col gap-6">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="font-display text-lg text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <ValuationWizard />
      </div>
    </div>
  );
}
