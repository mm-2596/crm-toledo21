"use client";

import { useState, useTransition } from "react";
import { sendLead } from "@/app/propiedades/[id]/actions";

export function ContactForm({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await sendLead(formData);
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold-soft p-6 text-sm text-ink">
        ¡Gracias! Hemos recibido tu mensaje sobre <strong>{propertyTitle}</strong>. Un agente de Toledo21 se pondrá en
        contacto contigo muy pronto.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-6">
      <h3 className="font-display text-lg text-ink">¿Te interesa esta propiedad?</h3>
      <input type="hidden" name="propertyId" value={propertyId} />

      <input
        name="name"
        required
        placeholder="Tu nombre"
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60"
      />
      <div className="flex gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60"
        />
        <input
          name="phone"
          placeholder="Teléfono"
          className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60"
        />
      </div>
      <textarea
        name="message"
        rows={3}
        placeholder="Cuéntanos qué te interesa saber…"
        className="resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60"
      />

      {result?.error && <p className="text-xs text-red-600">{result.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {isPending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
