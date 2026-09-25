"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Check, Home, Send, Store, Trees } from "lucide-react";
import { sendLead } from "@/app/propiedades/[id]/actions";
import { MarketingConsent } from "./MarketingConsent";

const TYPES = [
  { value: "Piso", icon: Building2 },
  { value: "Casa o chalet", icon: Home },
  { value: "Local u oficina", icon: Store },
  { value: "Terreno u otro", icon: Trees },
];
const CONDITIONS = ["Nuevo", "Buen estado", "Reformado", "A reformar"];
const EXTRAS = ["Ascensor", "Terraza", "Garaje", "Trastero", "Piscina", "Jardín"];
const TIMINGS = ["Cuanto antes", "En unos 3 meses", "Solo quiero saber cuánto vale"];
const STEP_TITLES = ["¿Qué quieres tasar?", "¿Dónde está?", "¿Cómo es?", "¿Cómo te contactamos?"];

const fieldClass =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        active ? "border-gold bg-gold text-ink" : "border-line bg-paper text-ink-soft hover:border-ink/30 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function ValuationWizard() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [condition, setCondition] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [timing, setTiming] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleExtra(extra: string) {
    setExtras((prev) => (prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]));
  }

  function canContinue(): boolean {
    if (step === 0) return Boolean(type);
    if (step === 1) return address.trim().length > 2;
    return true;
  }

  function submit() {
    if (!name.trim()) return setError("Dinos tu nombre para poder contactarte.");
    if (!email.trim() && !phone.trim()) return setError("Déjanos un teléfono o un email.");
    setError(null);

    const lines = [
      "TASACIÓN GRATUITA SOLICITADA DESDE LA WEB",
      `Tipo: ${type}`,
      `Ubicación: ${address.trim()}`,
      area ? `Superficie: ${area} m²` : null,
      bedrooms ? `Habitaciones: ${bedrooms}` : null,
      bathrooms ? `Baños: ${bathrooms}` : null,
      condition ? `Estado: ${condition}` : null,
      extras.length ? `Extras: ${extras.join(", ")}` : null,
      timing ? `Plazo para vender: ${timing}` : null,
    ].filter(Boolean);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("email", email.trim());
    formData.set("phone", phone.trim());
    formData.set("message", lines.join("\n"));
    if (consent) formData.set("marketingConsent", "true");

    startTransition(async () => {
      const res = await sendLead(formData);
      if (res.ok) setDone(true);
      else setError(res.error ?? "No se pudo enviar. Inténtalo de nuevo.");
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-3xl border border-gold/40 bg-paper p-8 shadow-xl shadow-black/5 sm:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-ink">
          <Check size={22} />
        </span>
        <h3 className="font-display text-2xl text-ink">¡Recibido! Ya estamos con tu tasación.</h3>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          Un agente de Toledo21 estudiará tu vivienda con datos reales de la zona y te contactará en menos de 24
          horas. Sin compromiso.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-line bg-paper p-6 shadow-xl shadow-black/5 sm:p-10">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-ink-soft">
        <span>
          Paso {step + 1} de {STEP_TITLES.length}
        </span>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-gold"
          animate={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        />
      </div>

      <h2 className="mt-8 font-display text-2xl text-ink sm:text-3xl">{STEP_TITLES[step]}</h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-6"
        >
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TYPES.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  aria-pressed={type === value}
                  className={`flex flex-col items-center gap-3 rounded-2xl border px-3 py-6 text-sm transition-colors ${
                    type === value
                      ? "border-gold bg-gold-soft text-ink"
                      : "border-line bg-paper text-ink-soft hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  <Icon size={26} strokeWidth={1.5} />
                  {value}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs text-ink-soft">Dirección o zona</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Calle Toledo, Getafe"
                  className={fieldClass}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-ink-soft">Superficie aproximada (m²)</span>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="90"
                  className={fieldClass}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label>
                  <span className="mb-1.5 block text-xs text-ink-soft">Habitaciones</span>
                  <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={fieldClass}>
                    <option value="">—</option>
                    {["1", "2", "3", "4", "5 o más"].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-xs text-ink-soft">Baños</span>
                  <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={fieldClass}>
                    <option value="">—</option>
                    {["1", "2", "3 o más"].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-2.5 text-xs text-ink-soft">Estado</p>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-xs text-ink-soft">Extras (elige los que tenga)</p>
                <div className="flex flex-wrap gap-2">
                  {EXTRAS.map((x) => (
                    <Chip key={x} active={extras.includes(x)} onClick={() => toggleExtra(x)}>
                      {x}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-xs text-ink-soft">¿Cuándo quieres vender?</p>
                <div className="flex flex-wrap gap-2">
                  {TIMINGS.map((t) => (
                    <Chip key={t} active={timing === t} onClick={() => setTiming(t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs text-ink-soft">Tu nombre</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-ink-soft">Teléfono</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  autoComplete="tel"
                  className={fieldClass}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-ink-soft">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  className={fieldClass}
                />
              </label>
              <p className="text-xs leading-relaxed text-ink-soft sm:col-span-2">
                Usamos tus datos para gestionar tu tasación, sin compromiso.
              </p>
              <MarketingConsent checked={consent} onChange={setConsent} className="sm:col-span-2" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink disabled:invisible"
        >
          <ArrowLeft size={15} /> Atrás
        </button>

        {step < STEP_TITLES.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue()}
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            Siguiente <ArrowRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {isPending ? "Enviando…" : "Pedir mi tasación gratis"} {!isPending && <Send size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}
