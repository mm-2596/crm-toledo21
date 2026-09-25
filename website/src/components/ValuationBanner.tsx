import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";

export function ValuationBanner() {
  return (
    <section className="bg-paper px-6 pb-16">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl border border-gold/40 bg-gold-soft px-8 py-8 sm:flex-row sm:items-center sm:px-12">
        <div className="flex items-start gap-5">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-ink sm:flex">
            <Calculator size={22} />
          </span>
          <div>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">¿Quieres saber cuánto vale tu vivienda?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              Tasación gratuita y sin compromiso, con datos reales de Getafe y Madrid sur. Respuesta en menos de 24
              horas.
            </p>
          </div>
        </div>
        <Link
          href="/tasacion"
          className="group flex shrink-0 items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition-transform hover:scale-[1.03]"
        >
          Tasar mi vivienda gratis
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
