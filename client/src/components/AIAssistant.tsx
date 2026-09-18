import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, LayoutList, Search, Send, Sparkles, X } from "lucide-react";
import { ActivitiesApi, ContactsApi, DashboardApi, PropertiesApi } from "../api/endpoints";
import { formatCurrency, formatDate } from "../lib/format";
import type { QueryClient } from "@tanstack/react-query";

interface Message {
  id: number;
  role: "assistant" | "user";
  text: string;
}

let msgId = 1;

const ROOT_TEXT = "¡Hola! 👋 Soy tu asistente del CRM. ¿Qué quieres hacer?";

type MenuStage = "root" | "consultar" | "contacto" | "tarea" | null;

const CATEGORIES: { key: Exclude<MenuStage, "root" | null>; label: string }[] = [
  { key: "consultar", label: "🔎 Consultar información" },
  { key: "contacto", label: "✍️ Dar de alta un contacto" },
  { key: "tarea", label: "📅 Crear una tarea o cita" },
];

const CATEGORY_TEXT: Record<Exclude<MenuStage, "root" | null>, string> = {
  consultar: "Puedo darte estos datos al momento. Elige uno, o escríbeme directamente algo como \"buscar Ana\" o \"propiedades en Getafe\":",
  contacto:
    "Para dar de alta un contacto, escríbeme algo como:\n\n\"agrégame a Laura Díaz con número 622333444\"\n\n" +
    "Y si además quieres crearle una cita a la vez:\n\n\"agrégame a Julio con número 622778822 y ponle una cita para el jueves\"",
  tarea:
    "Para crear una tarea o cita, escríbeme algo como:\n\n\"nueva tarea llamar a Ana mañana\"\n\n" +
    "Si quieres asociarla a un contacto que ya exista, añade \"para <nombre>\" al final.",
};

const SUGGESTIONS = ["Resumen", "Tareas", "Citas de hoy", "Propiedades disponibles"];
const MENU_TRIGGER = /^(hola|ayuda|men[uú]|qu[eé] puedes hacer)\b/i;

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

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  "miércoles": 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  "sábado": 6,
};

function nextWeekday(targetIndex: number): Date {
  const d = new Date();
  const diff = (targetIndex - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Extrae una fecha en lenguaje natural simple (hoy, mañana, día de la semana, dd/mm) y devuelve el resto del texto sin ella. */
function extractDate(text: string): { date: Date | null; rest: string } {
  if (/\bmañana\b/i.test(text)) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return { date, rest: text.replace(/\bmañana\b/i, "").trim() };
  }
  if (/\bhoy\b/i.test(text)) {
    return { date: new Date(), rest: text.replace(/\bhoy\b/i, "").trim() };
  }
  const weekdayMatch = text.match(/\b(?:para\s+el\s+|el\s+)?(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)\b/i);
  if (weekdayMatch) {
    const key = weekdayMatch[1].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const date = nextWeekday(WEEKDAYS[key]);
    return { date, rest: text.replace(weekdayMatch[0], "").trim() };
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
    return `Hecho ✅ Contacto creado: ${contact.name}${phone ? ` · ${phone}` : ""}${email ? ` · ${email}` : ""}.`;
  }

  const CONTACT_TRIGGER = /\b(agr[eé]game|agregar?|a[ñn]ad(?:e|eme)|apunta(?:me)?|dar de alta)\b/i;
  if (CONTACT_TRIGGER.test(q) && !q.startsWith("crear contacto")) {
    // Un mensaje puede pedir dos cosas a la vez ("agrégame a Julio... y
    // ponle una cita para el jueves") — se separa por la primera " y " para
    // tratar cada mitad por separado.
    const andIndex = input.search(/\sy\s/i);
    const contactPart = andIndex === -1 ? input : input.slice(0, andIndex);
    const taskPart = andIndex === -1 ? null : input.slice(andIndex + 3).trim();

    let contactSegment = contactPart.replace(CONTACT_TRIGGER, "").trim().replace(/^a\s+/i, "");
    const email = extractEmail(contactSegment);
    const phone = extractPhone(contactSegment);
    const name = contactSegment
      .replace(email ?? "", "")
      .replace(phone ?? "", "")
      .replace(/\bcon\s+(n[uú]mero|tel[eé]fono|tel)\b/gi, "")
      .replace(/[,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!name) return 'Dime al menos el nombre, por ejemplo: "agrégame a Julio con número 622778822".';

    const contact = await ContactsApi.create({ name, phone: phone ?? null, email: email ?? null, source: "MANUAL" });
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    let reply = `Hecho ✅ Contacto creado: ${contact.name}${phone ? ` · ${phone}` : ""}${email ? ` · ${email}` : ""}.`;

    if (taskPart && /\b(cita|tarea|agenda|recordatorio)\b/i.test(taskPart)) {
      const { date, rest: withoutDate } = extractDate(taskPart);
      let description = withoutDate
        .replace(/\b(ponle|pon(me)?|agenda(le|me)?|crea(le)?|añade(le)?)\b/gi, "")
        .replace(/\ben\s+tareas?\b/gi, "")
        .trim();
      if (!description || /^(una\s+)?cita\b/i.test(description)) description = `Cita con ${contact.name}`;

      await ActivitiesApi.create({
        type: "TAREA",
        description,
        contactId: contact.id,
        dueDate: date ? date.toISOString() : null,
      });
      queryClient.invalidateQueries({ queryKey: ["activities-pending"] });
      queryClient.invalidateQueries({ queryKey: ["contact", contact.id] });
      reply += `\nTambién le creé una tarea${date ? ` para ${formatDate(date.toISOString())}` : ""}: "${description}".`;
    }

    return reply;
  }

  const NEW_TASK_TRIGGER = /^(nueva tarea|crear tarea|agregar tarea|agrega tarea|pon(?:me)?\s+una\s+tarea|agenda(?:me)?\s+una\s+tarea)\b/i;
  if (NEW_TASK_TRIGGER.test(q)) {
    let rest = input.replace(NEW_TASK_TRIGGER, "").trim();
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
    return `Hecho ✅ Tarea creada${contactNote}${date ? ` · ${formatDate(date.toISOString())}` : ""}: "${description}".`;
  }

  if (q.includes("agenda") || q.includes("cita")) {
    const targetDate = /mañana/.test(q) ? (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    })() : new Date();

    const activities = await ActivitiesApi.list(true);
    const dayActivities = activities.filter((a) => a.dueDate && isSameDay(new Date(a.dueDate), targetDate));
    if (dayActivities.length === 0)
      return `No tienes citas ni tareas para ${isSameDay(targetDate, new Date()) ? "hoy" : "mañana"}. 🎉`;
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

  return 'Uy, no entendí eso todavía 🤔 Escribe "ayuda" para ver el menú de opciones.';
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: msgId++, role: "assistant", text: ROOT_TEXT }]);
  const [menuStage, setMenuStage] = useState<MenuStage>("root");
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();

  function scrollToBottom() {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
  }

  function showRootMenu() {
    setMessages((prev) => [...prev, { id: msgId++, role: "assistant", text: ROOT_TEXT }]);
    setMenuStage("root");
    scrollToBottom();
  }

  function selectCategory(key: Exclude<MenuStage, "root" | null>, label: string) {
    setMessages((prev) => [
      ...prev,
      { id: msgId++, role: "user", text: label },
      { id: msgId++, role: "assistant", text: CATEGORY_TEXT[key] },
    ]);
    setMenuStage(key);
    scrollToBottom();
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((prev) => [...prev, { id: msgId++, role: "user", text: clean }]);
    setInput("");

    if (MENU_TRIGGER.test(clean)) {
      setMessages((prev) => [...prev, { id: msgId++, role: "assistant", text: ROOT_TEXT }]);
      setMenuStage("root");
      scrollToBottom();
      return;
    }

    setThinking(true);
    setMenuStage(null);
    try {
      const reply = await answer(clean, queryClient);
      setMessages((prev) => [...prev, { id: msgId++, role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: msgId++, role: "assistant", text: "Algo falló al procesar eso. ¿Puedes reformularlo?" }]);
    } finally {
      setThinking(false);
      scrollToBottom();
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.12 } }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-24 right-5 z-40 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-4 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1c1815] text-white shadow-sm">
                <Sparkles size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#1c1815]">Asistente IA</div>
                <div className="truncate text-[11px] text-slate-500">Pregúntame o pídeme que anote algo</div>
              </div>
              <button
                onClick={showRootMenu}
                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-[#1c1815]/5 hover:text-slate-600"
                aria-label="Ver menú de opciones"
                title="Ver menú de opciones"
              >
                <LayoutList size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-[#1c1815]/5 hover:text-slate-600"
                aria-label="Cerrar asistente"
              >
                <X size={16} />
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === "assistant"
                      ? "mr-8 rounded-tl-sm bg-slate-100 text-slate-700"
                      : "ml-auto max-w-[85%] rounded-tr-sm bg-[#1c1815] text-white"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {thinking && (
                <div className="mr-8 flex w-fit items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              )}
              {menuStage === "root" && !thinking && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => selectCategory(c.key, c.label)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-[#2a241f] hover:bg-slate-100"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              {menuStage === "consultar" && !thinking && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-[#2a241f] hover:bg-slate-100"
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={showRootMenu}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                  >
                    ⬅ Volver
                  </button>
                </div>
              )}
              {(menuStage === "contacto" || menuStage === "tarea") && !thinking && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={showRootMenu}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                  >
                    ⬅ Volver al menú
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-2.5">
              <div className="relative flex-1">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe aquí…"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1c1815] text-white hover:bg-[#2a241f] disabled:opacity-40"
                aria-label="Enviar"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
        transition={{ type: "spring", bounce: 0, duration: 0.2 }}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1c1815] text-white shadow-lg hover:bg-[#2a241f]"
        aria-label={open ? "Cerrar asistente IA" : "Abrir asistente IA"}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </motion.button>
    </>
  );
}
