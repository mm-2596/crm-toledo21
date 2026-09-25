import Link from "next/link";

// Casilla opcional y desmarcada por defecto: el consentimiento para recibir
// publicidad debe ser una acción expresa (RGPD / LSSI), no algo implícito.
export function MarketingConsent({
  checked,
  onChange,
  className = "",
}: {
  checked?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
}) {
  const controlled = checked !== undefined;
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-ink-soft ${className}`}>
      <input
        type="checkbox"
        name="marketingConsent"
        {...(controlled ? { checked, onChange: (e) => onChange?.(e.target.checked) } : {})}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
      />
      <span>
        Quiero recibir novedades, inmuebles y ofertas de Toledo21 por email. Puedo darme de baja cuando quiera. Más
        información en la{" "}
        <Link href="/privacidad" className="underline underline-offset-2 hover:text-ink">
          política de privacidad
        </Link>
        .
      </span>
    </label>
  );
}
