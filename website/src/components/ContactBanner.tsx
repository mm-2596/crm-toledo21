"use client";

import { useState, useTransition } from "react";
import { Check, PhoneCall } from "lucide-react";
import { sendLead } from "@/app/propiedades/[id]/actions";
import { MarketingConsent } from "./MarketingConsent";

interface Item {
  id: string;
  title: string;
  reference: string;
}

const COPY = {
  favoritos: {
    title: "¿Te gustan estas propiedades? Te contactamos",
    text: "Déjanos tu teléfono y un agente de Toledo21 te llama para organizar las visitas de las que más te han gustado. Sin compromiso.",
    origin: "las he guardado en favoritos",
  },
  comparar: {
    title: "¿Ya tienes tu favorita? Lo vemos juntos",
    text: "Un agente de Toledo21 te llama, resuelve tus dudas sobre estas propiedades y te ayuda a decidir. Sin compromiso.",
    origin: "las estoy comparando",
  },
} as const;

// Banner de contacto de las páginas Favoritos y Comparar: mismo envío que el formulario de la ficha,
// con las propiedades que la persona está mirando en el mensaje para que el agente llegue preparado.
export function ContactBanner({ variant, items }: { variant: keyof typeof COPY; items: Item[] }) {
  const copy = COPY[variant];
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [consent, setConsent] = useState(false);

  if (items.length === 0) return null;

  function submit(formData: FormData) {
    if (!String(formData.get("phone") || "").trim() && !String(formData.get("email") || "").trim()) {
      setResult({ ok: false, error: "Indícanos un teléfono o un correo para poder contactarte." });
      return;
    }
    formData.set("propertyId", items[0].id);
    formData.set(
      "message",
      `Me interesan estas propiedades (${copy.origin}): ${items.map((i) => `${i.title} (ref. ${i.reference})`).join("; ")}.`,
    );
    formData.set("marketingConsent", consent ? "true" : "false");
    startTransition(async () => setResult(await sendLead(formData)));
  }

  if (result?.ok) {
    return (
      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft p-5 text-sm text-ink">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-paper">
          <Check size={18} />
        </span>
        <p>
          <strong>¡Gracias!</strong> Hemos recibido tu solicitud. Un agente de Toledo21 te contactará muy pronto.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Contacto" className="mt-8 grid gap-6 rounded-2xl border border-gold/40 bg-gold-soft p-6 md:grid-cols-[1fr_1.1fr] md:items-center md:p-8">
      <div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-paper">
          <PhoneCall size={18} />
        </span>
        <h2 className="mt-3 font-display text-xl text-ink sm:text-2xl">{copy.title}</h2>
        <p className="mt-1.5 max-w-md text-sm text-ink-soft">{copy.text}</p>
      </div>

      <form action={submit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input name="name" required autoComplete="name" placeholder="Tu nombre" aria-label="Tu nombre" className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60" />
          <input name="phone" type="tel" autoComplete="tel" placeholder="Teléfono" aria-label="Teléfono" className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60" />
        </div>
        <input name="email" type="email" autoComplete="email" placeholder="Email (opcional)" aria-label="Email" className="rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60" />
        <MarketingConsent checked={consent} onChange={setConsent} />
        {result?.error && <p className="text-xs text-red-600">{result.error}</p>}
        <button type="submit" disabled={pending} className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-transform hover:scale-[1.02] disabled:opacity-60">
          {pending ? "Enviando…" : "Quiero que me contacten"}
        </button>
      </form>
    </section>
  );
}
