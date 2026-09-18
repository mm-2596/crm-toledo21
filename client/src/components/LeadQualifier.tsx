import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ContactsApi } from "../api/endpoints";
import { formatCurrency } from "../lib/format";
import type { ContactPriority, ListingType } from "../api/types";

interface Answers {
  zone: string;
  listingType: ListingType;
  budgetMax: number | null;
  bedroomsMin: number | null;
  needsFinancing: boolean | null;
}

const questions = [
  "¿En qué zona busca?",
  "¿Es para comprar o alquilar?",
  "¿Qué presupuesto tiene en mente?",
  "¿Cuántas habitaciones necesita, como mínimo?",
  "¿Necesita financiación?",
];

function computePriority(a: Answers): ContactPriority {
  if (!a.budgetMax) return "BAJA";
  if (a.needsFinancing === true) return "ALTA";
  return "MEDIA";
}

export function LeadQualifier({ contactId, onSaved }: { contactId: string; onSaved: (priority: ContactPriority) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    zone: "",
    listingType: "VENTA",
    budgetMax: null,
    bedroomsMin: null,
    needsFinancing: null,
  });
  const [saving, setSaving] = useState(false);
  const reduceMotion = useReducedMotion();

  const history: { q: string; a: string }[] = [];
  if (step > 0) history.push({ q: questions[0], a: answers.zone || "-" });
  if (step > 1) history.push({ q: questions[1], a: answers.listingType === "VENTA" ? "Comprar" : "Alquilar" });
  if (step > 2) history.push({ q: questions[2], a: answers.budgetMax ? formatCurrency(answers.budgetMax) : "-" });
  if (step > 3) history.push({ q: questions[3], a: answers.bedroomsMin ? String(answers.bedroomsMin) : "-" });

  const priority = computePriority(answers);

  async function handleSave() {
    setSaving(true);
    try {
      await ContactsApi.update(contactId, {
        preferredZone: answers.zone || null,
        listingType: answers.listingType,
        budgetMax: answers.budgetMax,
        bedroomsMin: answers.bedroomsMin,
        needsFinancing: answers.needsFinancing,
        priority,
      });
      onSaved(priority);
    } finally {
      setSaving(false);
    }
  }

  const bubbleTransition = { type: "spring" as const, bounce: 0, duration: 0.3 };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-center gap-2 text-slate-800">
        <Sparkles size={16} />
        <h3 className="text-sm font-semibold">Calificador de leads (IA)</h3>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        {history.map((h, i) => (
          <motion.div
            key={i}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={bubbleTransition}
          >
            <div className="mb-1 max-w-[85%] rounded-xl rounded-bl-sm bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
              {h.q}
            </div>
            <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-slate-900 px-3 py-1.5 text-right text-xs text-white shadow-sm">
              {h.a}
            </div>
          </motion.div>
        ))}
      </div>

      {step < questions.length && (
        <motion.div
          key={step}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={bubbleTransition}
        >
          <div className="mb-2 max-w-[85%] rounded-xl rounded-bl-sm bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            {questions[step]}
          </div>

          {step === 0 && (
            <div className="flex gap-2">
              <input
                autoFocus
                value={answers.zone}
                onChange={(e) => setAnswers({ ...answers, zone: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && answers.zone && setStep(1)}
                placeholder="Ej. Casco Histórico"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400"
              />
              <button
                disabled={!answers.zone}
                onClick={() => setStep(1)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="flex gap-2">
              {(["VENTA", "ALQUILER"] as ListingType[]).map((lt) => (
                <button
                  key={lt}
                  onClick={() => {
                    setAnswers({ ...answers, listingType: lt });
                    setStep(2);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  {lt === "VENTA" ? "Comprar" : "Alquilar"}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-2">
              <input
                autoFocus
                type="number"
                onChange={(e) => setAnswers({ ...answers, budgetMax: e.target.value ? Number(e.target.value) : null })}
                onKeyDown={(e) => e.key === "Enter" && setStep(3)}
                placeholder="Ej. 320000"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400"
              />
              <button
                onClick={() => setStep(3)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                Siguiente
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex gap-2">
              <input
                autoFocus
                type="number"
                onChange={(e) => setAnswers({ ...answers, bedroomsMin: e.target.value ? Number(e.target.value) : null })}
                onKeyDown={(e) => e.key === "Enter" && setStep(4)}
                placeholder="Ej. 2"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400"
              />
              <button onClick={() => setStep(4)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                Siguiente
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="flex gap-2">
              {[
                { label: "Sí", value: true },
                { label: "No", value: false },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setAnswers({ ...answers, needsFinancing: opt.value });
                    setStep(5);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {step >= questions.length && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={bubbleTransition}
          className="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Lead cualificado</span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
              priority === "ALTA" ? "bg-red-50 text-red-600" : priority === "MEDIA" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}>
              Prioridad {priority.toLowerCase()}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
            <dt className="text-slate-400">Zona</dt>
            <dd className="text-slate-700">{answers.zone || "-"}</dd>
            <dt className="text-slate-400">Operación</dt>
            <dd className="text-slate-700">{answers.listingType === "VENTA" ? "Compra" : "Alquiler"}</dd>
            <dt className="text-slate-400">Presupuesto</dt>
            <dd className="text-slate-700">{answers.budgetMax ? formatCurrency(answers.budgetMax) : "-"}</dd>
            <dt className="text-slate-400">Habitaciones</dt>
            <dd className="text-slate-700">{answers.bedroomsMin ?? "-"}</dd>
            <dt className="text-slate-400">Financiación</dt>
            <dd className="text-slate-700">{answers.needsFinancing ? "Sí" : "No"}</dd>
          </dl>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar en la ficha del contacto"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
