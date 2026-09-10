import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { ActivitiesApi, ContactsApi, DashboardApi, PropertiesApi } from "../api/endpoints";
import { formatCurrency, formatDate } from "../lib/format";

interface Message {
  id: number;
  role: "assistant" | "user";
  text: string;
}

let msgId = 1;

const WELCOME =
  "Hola, soy el asistente del CRM. Puedo consultar cosas por ti mientras trabajas. Prueba:\n" +
  "· \"tareas\" — tus pendientes\n" +
  "· \"buscar <nombre>\" — localizar un contacto\n" +
  "· \"propiedades en <ciudad>\" — inmuebles disponibles\n" +
  "· \"resumen\" — cifras del panel";

async function answer(input: string): Promise<string> {
  const q = input.toLowerCase().trim();

  if (/^hola|ayuda/.test(q)) return WELCOME;

  if (q.includes("tarea") || q.includes("pendiente")) {
    const activities = await ActivitiesApi.list(true);
    if (activities.length === 0) return "No tienes tareas pendientes con fecha. 🎉";
    return (
      "Tareas pendientes:\n" +
      activities
        .slice(0, 5)
        .map((a) => `· ${formatDate(a.dueDate)} — ${a.description}${a.contact ? ` (${a.contact.name})` : ""}`)
        .join("\n")
    );
  }

  if (q.startsWith("buscar")) {
    const term = input.slice(input.toLowerCase().indexOf("buscar") + 6).trim();
    if (!term) return 'Dime a quién busco, por ejemplo: "buscar Ana".';
    const contacts = await ContactsApi.list(term);
    if (contacts.length === 0) return `No encuentro ningún contacto que coincida con "${term}".`;
    return (
      `Contactos que coinciden con "${term}":\n` +
      contacts.slice(0, 5).map((c) => `· ${c.name}${c.phone ? ` — ${c.phone}` : ""}${c.email ? ` — ${c.email}` : ""}`).join("\n")
    );
  }

  if (q.includes("propiedad")) {
    const cityMatch = q.match(/en\s+([a-záéíóúñ\s]+)$/i);
    const city = cityMatch ? cityMatch[1].trim() : undefined;
    const properties = await PropertiesApi.list(city ? { city } : undefined);
    if (properties.length === 0) return city ? `No hay propiedades cargadas en ${city}.` : "No hay propiedades cargadas todavía.";
    return (
      (city ? `Propiedades en ${city}:\n` : "Propiedades disponibles:\n") +
      properties.slice(0, 5).map((p) => `· ${p.title} — ${formatCurrency(p.price)} (${p.reference})`).join("\n")
    );
  }

  if (q.includes("resumen")) {
    const summary = await DashboardApi.summary();
    return (
      `Resumen actual:\n` +
      `· Contactos: ${summary.contactsCount}\n` +
      `· Propiedades disponibles: ${summary.propertiesAvailable}\n` +
      `· Oportunidades abiertas: ${summary.openDeals}\n` +
      `· Cerradas ganadas: ${summary.wonDeals}\n` +
      `· Tareas pendientes: ${summary.pendingActivities}`
    );
  }

  return 'No entendí eso todavía. Prueba con "tareas", "buscar <nombre>", "propiedades en <ciudad>" o "resumen".';
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: msgId++, role: "assistant", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: msgId++, role: "user", text }]);
    setInput("");
    setThinking(true);
    try {
      const reply = await answer(text);
      setMessages((prev) => [...prev, { id: msgId++, role: "assistant", text: reply }]);
    } finally {
      setThinking(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12, transition: { duration: 0.15 } }}
            transition={{ type: "spring", damping: 1, stiffness: 300, mass: 0.5 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-24 right-5 z-40 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 bg-white/70 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Sparkles size={14} />
              </div>
              <div className="text-sm font-semibold text-slate-900">Asistente IA</div>
              <button onClick={() => setOpen(false)} className="ml-auto text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`whitespace-pre-line rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === "assistant"
                      ? "bg-slate-100 text-slate-700"
                      : "ml-auto max-w-[85%] bg-indigo-600 text-white"
                  } ${m.role === "assistant" ? "mr-8" : ""}`}
                >
                  {m.text}
                </div>
              ))}
              {thinking && <div className="mr-8 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-400">Consultando…</div>}
            </div>
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe una pregunta…"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
        aria-label="Abrir asistente IA"
      >
        <Bot size={22} />
      </button>
    </>
  );
}
