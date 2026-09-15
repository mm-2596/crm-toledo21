"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { sendLead } from "@/app/propiedades/[id]/actions";

export function HomeContactForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await sendLead(formData);
      setResult(res);
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="grid grid-cols-1 gap-12 rounded-3xl bg-ink px-8 py-14 sm:px-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">Hablemos</p>
          <h2 className="mt-3 font-display text-3xl text-paper sm:text-4xl">¿Buscas piso o quieres vender?</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/70">
            Cuéntanos qué necesitas y un agente de Toledo21 te responde en menos de 24 horas. En cuanto envíes el
            formulario, te llega un correo confirmando que lo hemos recibido.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href="mailto:info@somostuinmobiliaria.es"
              className="flex items-center gap-3 text-sm text-paper/80 hover:text-paper"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-gold">
                <Mail size={15} />
              </span>
              info@somostuinmobiliaria.es
            </a>
            <a href="tel:+34673490094" className="flex items-center gap-3 text-sm text-paper/80 hover:text-paper">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-gold">
                <Phone size={15} />
              </span>
              673 49 00 94
            </a>
            <a
              href="https://www.google.com/maps/place/Toledo21+-+SomosTuInmobiliaria+-+Getafe,+C.+Toledo,+21,+28901+Getafe,+Madrid/@40.3034017,-3.7327946,15z"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-sm text-paper/80 hover:text-paper"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-gold">
                <MapPin size={15} />
              </span>
              C. Toledo, 21, Getafe, Madrid
            </a>
          </div>
        </div>

        <div>
          {result?.ok ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex h-full flex-col items-start justify-center rounded-2xl border border-gold/30 bg-paper/[0.06] p-8"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-ink">
                <Send size={18} />
              </div>
              <h3 className="mt-4 font-display text-xl text-paper">¡Mensaje enviado!</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/70">
                Te acabamos de mandar un correo de confirmación. Un agente de Toledo21 se pondrá en contacto contigo
                muy pronto.
              </p>
            </motion.div>
          ) : (
            <form action={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-paper p-6 sm:p-8">
              <input
                name="name"
                required
                placeholder="Tu nombre"
                className="rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60"
                />
                <input
                  name="phone"
                  placeholder="Teléfono (opcional)"
                  className="flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60"
                />
              </div>
              <textarea
                name="message"
                rows={4}
                placeholder="Cuéntanos qué buscas o en qué podemos ayudarte…"
                className="resize-none rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60"
              />

              {result?.error && <p className="text-xs text-red-600">{result.error}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-paper transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {isPending ? "Enviando…" : "Enviar mensaje"}
                {!isPending && <Send size={15} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
