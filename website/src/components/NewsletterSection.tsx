"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";

export function NewsletterSection() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await subscribeToNewsletter(formData);
      setResult(res);
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid overflow-hidden rounded-3xl border border-line shadow-xl shadow-black/5 lg:grid-cols-2">
        <div className="relative min-h-[280px] lg:min-h-0">
          <Image
            src="/images/newsletter-agent.jpg"
            alt="Agente entregando las llaves de una vivienda a unos clientes"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-ink/10" />
        </div>

        <div className="flex flex-col justify-center gap-5 bg-paper p-8 sm:p-12">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gold">No te pierdas nada</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Suscríbete a nuestra newsletter</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
              Entérate antes que nadie de los inmuebles nuevos y de las novedades del sector en Getafe y Madrid sur.
            </p>
          </div>

          {result?.ok ? (
            <div className="rounded-2xl border border-gold/30 bg-gold-soft p-5 text-sm text-ink">
              ¡Ya estás dentro! Revisa tu bandeja de entrada de vez en cuando.
            </div>
          ) : (
            <form action={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Tu email"
                  className="w-full rounded-xl border border-line bg-paper py-3 pl-10 pr-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
                <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold)]" />
                <span>
                  He leído y acepto la{" "}
                  <Link href="/privacidad" className="underline underline-offset-2 hover:text-ink">
                    política de privacidad
                  </Link>
                  .
                </span>
              </label>

              {result?.error && <p className="text-xs text-red-600">{result.error}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-paper transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {isPending ? "Enviando…" : "Suscribirme"}
                {!isPending && <Send size={15} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
