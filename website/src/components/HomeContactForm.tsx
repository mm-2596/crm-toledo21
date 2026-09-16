"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, User, MessageSquare } from "lucide-react";
import { sendLead } from "@/app/propiedades/[id]/actions";

const fieldClass =
  "peer w-full rounded-xl border border-line bg-paper px-10 py-3.5 text-sm text-ink placeholder-transparent outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/25";

const labelClass =
  "pointer-events-none absolute left-10 top-3.5 text-sm text-ink-soft/70 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:-top-2.5 peer-focus:left-3 peer-focus:bg-paper peer-focus:px-1.5 peer-focus:text-xs peer-focus:text-gold peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:bg-paper peer-[:not(:placeholder-shown)]:px-1.5 peer-[:not(:placeholder-shown)]:text-xs";

const iconClass = "pointer-events-none absolute left-3 top-3.5 text-ink-soft/50 peer-focus:text-gold";

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
      <div className="relative grid grid-cols-1 gap-12 overflow-hidden rounded-3xl bg-ink px-8 py-14 sm:px-12 lg:grid-cols-2 lg:gap-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />

        <div className="relative">
          <h2 className="font-display text-3xl text-paper sm:text-4xl">¿Buscas piso o quieres vender?</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/70">
            Cuéntanos qué necesitas y un agente de Toledo21 te responde en menos de 24 horas. En cuanto envíes el
            formulario, te llega un correo confirmando que lo hemos recibido.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href="mailto:info@somostuinmobiliaria.es"
              className="group flex items-center gap-3 text-sm text-paper/80 transition-colors hover:text-paper"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
                <Mail size={15} />
              </span>
              info@somostuinmobiliaria.es
            </a>
            <a
              href="tel:+34673490094"
              className="group flex items-center gap-3 text-sm text-paper/80 transition-colors hover:text-paper"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
                <Phone size={15} />
              </span>
              673 49 00 94
            </a>
            <a
              href="https://www.google.com/maps/place/Toledo21+-+SomosTuInmobiliaria+-+Getafe,+C.+Toledo,+21,+28901+Getafe,+Madrid/@40.3034017,-3.7327946,15z"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 text-sm text-paper/80 transition-colors hover:text-paper"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
                <MapPin size={15} />
              </span>
              C. Toledo, 21, Getafe, Madrid
            </a>
          </div>
        </div>

        <div className="relative">
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
            <form action={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-paper p-6 shadow-xl shadow-black/20 sm:p-8">
              <div className="relative">
                <User size={16} className={iconClass} />
                <input id="name" name="name" required placeholder=" " className={fieldClass} />
                <label htmlFor="name" className={labelClass}>
                  Tu nombre
                </label>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Mail size={16} className={iconClass} />
                  <input id="email" name="email" type="email" placeholder=" " className={fieldClass} />
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                </div>
                <div className="relative flex-1">
                  <Phone size={16} className={iconClass} />
                  <input id="phone" name="phone" placeholder=" " className={fieldClass} />
                  <label htmlFor="phone" className={labelClass}>
                    Teléfono (opcional)
                  </label>
                </div>
              </div>

              <div className="relative">
                <MessageSquare size={16} className={`${iconClass} top-4`} />
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder=" "
                  className={`${fieldClass} resize-none`}
                />
                <label htmlFor="message" className={labelClass}>
                  ¿Qué buscas o en qué podemos ayudarte?
                </label>
              </div>

              {result?.error && <p className="text-xs text-red-600">{result.error}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {isPending ? "Enviando…" : "Enviar mensaje"}
                {!isPending && <Send size={15} />}
              </button>

              <p className="text-center text-xs text-ink-soft/70">Sin compromiso · Respuesta en menos de 24 horas</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
