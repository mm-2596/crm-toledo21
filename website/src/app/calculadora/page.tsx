import { MortgageCalculator } from "@/components/MortgageCalculator";

export const metadata = { title: "Calculadora de hipoteca" };

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-14 pt-28">
      <p className="text-xs font-medium uppercase tracking-wider text-gold">Herramientas</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Calculadora de hipoteca</h1>
      <p className="mt-3 max-w-xl text-sm text-ink-soft">
        Ajusta el precio, la entrada, el plazo y el tipo de interés para estimar tu cuota mensual antes de dar el
        siguiente paso.
      </p>
      <div className="mt-10">
        <MortgageCalculator />
      </div>
    </div>
  );
}
