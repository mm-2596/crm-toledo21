"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Heart, X } from "lucide-react";
import { sendLead } from "@/app/propiedades/[id]/actions";
import { MarketingConsent } from "./MarketingConsent";
import { useFavorites } from "./FavoritesContext";

const SENT_KEY = "toledo21-lead-sent";
const PROMPTED_KEY = "toledo21-like-prompted";

type View = "form" | "toast" | "thanks" | null;

function read(storage: "local" | "session", key: string): boolean {
  try {
    return (storage === "local" ? localStorage : sessionStorage).getItem(key) === "1";
  } catch {
    return false;
  }
}
function write(storage: "local" | "session", key: string) {
  try {
    (storage === "local" ? localStorage : sessionStorage).setItem(key, "1");
  } catch {
    // modo privado: se ignora
  }
}

// Al guardar una propiedad (corazón) salta un aviso: la primera vez de cada visita ofrece que un agente
// contacte; el resto de veces (o si ya dejó sus datos) es solo una confirmación breve.
export function FavoritePrompt() {
  const { lastAdded, dismissLastAdded } = useFavorites();
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<View>(null);
  const [current, setCurrent] = useState(lastAdded);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!lastAdded) return;
    // Llega una propiedad guardada nueva: decide si mostrar el formulario o solo la confirmación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(lastAdded);
    setError(null);
    if (read("local", SENT_KEY) || read("session", PROMPTED_KEY)) setView("toast");
    else {
      write("session", PROMPTED_KEY);
      setView("form");
    }
  }, [lastAdded]);

  useEffect(() => {
    if (view !== "toast" && view !== "thanks") return;
    const t = setTimeout(() => close(), view === "thanks" ? 3500 : 3200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, current]);

  useEffect(() => {
    if (view !== "form") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  function close() {
    setView(null);
    dismissLastAdded();
  }

  function submit(formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    if (!name || !phone) {
      setError("Indícanos tu nombre y un teléfono para poder llamarte.");
      return;
    }
    setError(null);
    formData.set("propertyId", current?.id ?? "");
    formData.set("message", `Me ha gustado esta propiedad (la guardé en favoritos)${current?.reference ? `: ref. ${current.reference}` : ""}. Quiero que me contacten.`);
    formData.set("marketingConsent", consent ? "true" : "false");
    startTransition(async () => {
      const res = await sendLead(formData);
      if (res.ok) {
        write("local", SENT_KEY);
        setView("thanks");
      } else setError(res.error ?? "No se pudo enviar. Inténtalo de nuevo.");
    });
  }

  const enter = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 };

  return (
    <AnimatePresence>
      {view && current && (
        <motion.div
          key={view === "form" ? "form" : "small"}
          initial={enter}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
          className="fixed inset-x-3 bottom-3 z-[70] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[390px]"
          role="status"
          aria-live="polite"
        >
          {view === "form" && (
            <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl shadow-black/20">
              <div className="flex items-start gap-3 bg-gold-soft px-4 py-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-paper">
                  <Heart size={15} fill="currentColor" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base leading-tight text-ink">¡Guardada en tus favoritos!</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">{current.title}</p>
                </div>
                <button onClick={close} aria-label="Cerrar" className="rounded-full p-1 text-ink-soft hover:bg-paper/60 hover:text-ink">
                  <X size={16} />
                </button>
              </div>

              <form action={submit} className="flex flex-col gap-3 p-4">
                <p className="text-sm text-ink">
                  ¿Quieres que un agente de Toledo21 <strong>te contacte</strong> sobre esta propiedad? Te llamamos sin compromiso.
                </p>
                <div className="flex gap-2">
                  <input name="name" required autoComplete="name" placeholder="Tu nombre" aria-label="Tu nombre" className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60" />
                  <input name="phone" type="tel" required autoComplete="tel" placeholder="Teléfono" aria-label="Teléfono" className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60" />
                </div>
                <MarketingConsent checked={consent} onChange={setConsent} />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={pending} className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-transform hover:scale-[1.02] disabled:opacity-60">
                    {pending ? "Enviando…" : "Sí, contáctenme"}
                  </button>
                  <button type="button" onClick={close} className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                    Ahora no
                  </button>
                </div>
              </form>
            </div>
          )}

          {view === "toast" && (
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 shadow-xl shadow-black/15">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-paper">
                <Heart size={15} fill="currentColor" />
              </span>
              <p className="min-w-0 flex-1 truncate text-sm text-ink">Guardada en favoritos</p>
              <Link href="/favoritos" onClick={close} className="shrink-0 text-sm font-medium text-ink underline-offset-4 hover:underline">
                Ver favoritos
              </Link>
            </div>
          )}

          {view === "thanks" && (
            <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3.5 shadow-xl shadow-black/15">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-paper">
                <Check size={16} />
              </span>
              <p className="text-sm text-ink">
                <strong>¡Perfecto!</strong> Un agente te contactará muy pronto.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
