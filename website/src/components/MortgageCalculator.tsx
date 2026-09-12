"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";

export function MortgageCalculator({ initialPrice }: { initialPrice?: number }) {
  const [price, setPrice] = useState(initialPrice ?? 250000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(3.2);

  const { monthlyPayment, loanAmount, downPayment, totalPaid, totalInterest } = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const loanAmount = Math.max(price - downPayment, 0);
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;

    const monthlyPayment =
      monthlyRate === 0
        ? loanAmount / numPayments
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalPaid = monthlyPayment * numPayments;
    const totalInterest = totalPaid - loanAmount;

    return { monthlyPayment, loanAmount, downPayment, totalPaid, totalInterest };
  }, [price, downPaymentPct, years, rate]);

  return (
    <div className="grid grid-cols-1 gap-8 rounded-2xl border border-line bg-paper p-6 sm:p-8 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <SliderField
          label="Precio de la vivienda"
          value={price}
          onChange={setPrice}
          min={30000}
          max={1500000}
          step={5000}
          display={formatCurrency(price)}
        />
        <SliderField
          label="Entrada"
          value={downPaymentPct}
          onChange={setDownPaymentPct}
          min={0}
          max={60}
          step={1}
          display={`${downPaymentPct}% · ${formatCurrency(price * (downPaymentPct / 100))}`}
        />
        <SliderField
          label="Plazo"
          value={years}
          onChange={setYears}
          min={5}
          max={40}
          step={1}
          display={`${years} años`}
        />
        <SliderField
          label="Tipo de interés (TIN)"
          value={rate}
          onChange={setRate}
          min={0.5}
          max={8}
          step={0.05}
          display={`${rate.toFixed(2)}%`}
        />
      </div>

      <div className="flex flex-col justify-center gap-6 rounded-xl bg-paper-dim p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">Cuota mensual estimada</p>
          <p className="mt-1 font-display text-4xl text-ink">{formatCurrency(monthlyPayment)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Summary label="Entrada" value={formatCurrency(downPayment)} />
          <Summary label="Importe financiado" value={formatCurrency(loanAmount)} />
          <Summary label="Intereses totales" value={formatCurrency(totalInterest)} />
          <Summary label="Total a pagar" value={formatCurrency(totalPaid)} />
        </div>
        <p className="text-xs text-ink-soft">
          Estimación orientativa sin comisiones ni gastos de gestión. Consulta con tu agente Toledo21 para un cálculo
          personalizado.
        </p>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">{label}</span>
        <span className="font-medium text-ink">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-gold"
      />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
