import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { ActivitiesApi, ContactsApi, DashboardApi, PropertiesApi } from "../api/endpoints";
import { formatCurrency, formatDate } from "../lib/format";
import type { QueryClient } from "@tanstack/react-query";

interface Message {
  id: number;
  role: "assistant" | "user";
  text: string;
}

let msgId = 1;

const WELCOME =
  "Hola, soy el asistente del CRM. Puedo consultar y anotar cosas por ti mientras trabajas. Prueba:\n" +
  "· \"tareas\" — tus pendientes\n" +
  "· \"citas de hoy\" / \"citas de mañana\" — tu agenda\n" +
  "· \"buscar <nombre>\" — localizar un contacto\n" +
  "· \"crear contacto <nombre> <teléfono>\" — dar de alta un lead\n" +
  "· \"nueva tarea <texto> para <nombre> mañana\" — agendar un seguimiento\n" +
  "· \"propiedades en <ciudad>\" — inmuebles disponibles\n" +
  "· \"resumen\" — cifras del panel";

function extractEmail(text: string): string | undefined {
  return text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)?.[0];
}

function extractPhone(text: string): string | undefined {
  return text.match(/(\+?\d[\d\s]{5,}\d)/)?.[0]?.trim();
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Extrae una fecha en lenguaje natural simple (hoy, mañana, dd/mm) y devuelve el resto del texto sin ella. */
function extractDate(text: string): { date: Date | null; rest: string } {
  if (/\bmañana\b/i.test(text)) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return { date, rest: text.replace(/\bmañana\b/i, "").trim() };
  }
  if (/\bhoy\b/i.test(text)) {
    return { date: new Date(), rest: text.replace(/\bhoy\b/i, "").trim() };
  }
  const match = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const date = new Date();
    date.setMonth(Number(match[2]) - 1, Number(match[1]));
    return { date, rest: text.replace(match[0], "").trim() };
  }
  return { date: null, rest: text };
}

async function answer(input: string, queryClient: QueryClient): Promise<string> {
  const q = input.toLowerCase().trim();

  if (/^hola\b|^ayuda\b/.test(q)) return WELCOME;

  if (q.startsWith("crear contacto")) {
    const rest = input.replace(/crear contacto/i, "").trim();
    const email = extractEmail(rest);
    const phone = extractPhone(rest);
    const name = rest
      .replace(email ?? "", "")
      .replace(phone ?? "", "")
      .replace(/[,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!name) return 'Dime al menos el nombre, por ejemplo: "crear contacto Laura Díaz 622333444".';
    const contact = await ContactsApi.create({ name, phone: phone ?? null, email: email ?? null, source: "MANUAL" });
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    return `Contacto creado: ${contact.name}${phone ? ` · ${phone}` : ""}${email ? ` · ${email}` : ""}.`;
  }

  if (q.startsWith("nueva tarea")) {
    let rest = input.replace(/nueva tarea/i, "").trim();
    const { date, rest: withoutDate } = extractDate(rest);
    rest = withoutDate;

    // Se busca la ÚLTIMA aparición de "para" (no la primera), porque la propia
    // descripción de la tarea puede contener esa palabra de forma natural
    // ("llamar para concretar visita para Ana").
    let contactName: string | undefined;
    const paraIndex = rest.toLowerCase().lastIndexOf(" para ");
    if (paraIndex !== -1) {
      contactName = rest.slice(paraIndex + 6).trim();
      rest = rest.slice(0, paraIndex).trim();
    }

    const description = rest.trim();
    if (!description) return 'Dime qué tarea quieres crear, por ejemplo: "nueva tarea Llamar para visita para Ana mañana".';

    let contactId: string | null = null;
    let contactNote = "";
    if (contactName) {
      const matches = await ContactsApi.list(contactName);
      if (matches[0]) {
        contactId = matches[0].id;
        contactNote = ` para ${matches[0].name}`;
      } else {
        contactNote = ` (no encontré ningún contacto llamado "${contactName}", se ha creado sin asociar)`;
      }
    }

    await ActivitiesApi.create({
      type: "TAREA",
      description,
      contactId,
      dueDate: date ? date.toISOString() : null,
    });
    queryClient.invalidateQueries({ queryKey: ["activities-pending"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    if (contactId) queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
    return `Tarea creada${contactNote}${date ? ` · ${formatDate(date.toISOString())}` : ""}: "${description}".`;
  }

  if (q.includes("agenda") || q.includes("cita")) {
    const targetDate = /mañana/.test(q) ? (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    })() : new Date();

    const activities = await ActivitiesApi.list(true);
    const dayActivities = activities.filter((a) => a.dueDate && isSameDay(new Date(a.dueDate), targetDate));
    if (dayActivities.length === 0) return `No tienes citas ni tareas para ${isSameDay(targetDate, new Date()) ? "hoy" : "mañana"}.`;
    return (
      `Agenda para ${isSameDay(targetDate, new Date()) ? "hoy" : "mañana"}:\n` +
      dayActivities.map((a) => `· ${a.description}${a.contact ? ` (${a.contact.name})` : ""}`).join("\n")
    );
  }

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

  return 'No entendí eso todavía. Escribe "ayuda" para ver lo que puedo hacer.';
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: msgId++, role: "assistant", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: msgId++, role: "user", text }]);
    setInput("");
    setThinking(true);
    try {
      const reply = await answer(text, queryClient);
      setMessages((prev) => [...prev, { id: msgId++, role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: msgId++, role: "assistant", text: "Algo falló al procesar eso. ¿Puedes reformularlo?" }]);
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
