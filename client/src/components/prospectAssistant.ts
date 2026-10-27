import type { QueryClient } from "@tanstack/react-query";
import { ActivitiesApi, BuildingsApi, ContactsApi, DwellingsApi, ProspectionsApi } from "../api/endpoints";
import { formatDate, formatDateTime } from "../lib/format";
import {
  findDwelling,
  findDwellingsByPerson,
  formatUnit,
  isCancel,
  isDontKnow,
  matchBuildings,
  matchBuildingsByWords,
  parseProspectNote,
  parseUnitAnswer,
  wordsMatch,
  type ParsedNote,
} from "../lib/prospectNote";
import type { Building, Dwelling } from "../api/types";

export interface Choice {
  label: string;
  /** Qué hace el botón. Si en vez de eso lleva `href`, abre esa pantalla del CRM. */
  run?: () => Promise<Reply>;
  href?: string;
}
export type Reply = string | { text: string; choices?: Choice[] };

/** Lo que falta por preguntar: el asistente guarda la frase y la completa con la respuesta siguiente. */
export interface PendingProspect {
  text: string;
  buildingId?: string;
  /** La frase tal como la escribió la persona: es la que se guarda como nota, sin las respuestas añadidas después. */
  original?: string;
  /** Qué se está esperando: el edificio, la planta y puerta, o lo que se habló con una persona ya elegida. */
  awaiting?: "building" | "unit" | "note";
  target?: Target;
}

/** A quién va dirigida una nota o una llamada: un contacto o un piso. */
export type Target = { kind: "contact"; id: string; name: string } | { kind: "dwelling"; id: string; name: string; place: string };
export type PendingRef = { current: PendingProspect | null };

type Reminder = { date: Date; hasTime: boolean } | null;

const QUICK_DATES: { label: string; days?: number; months?: number }[] = [
  { label: "Mañana", days: 1 },
  { label: "En una semana", days: 7 },
  { label: "En 15 días", days: 15 },
  { label: "En un mes", months: 1 },
  { label: "En 3 meses", months: 3 },
];

interface Draft {
  building: Building;
  floor: string;
  door: string | null;
  dwellingId: string | null;
  parsed: ParsedNote;
  reminder: Reminder;
}

function inFuture(q: { days?: number; months?: number }): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (q.days) d.setDate(d.getDate() + q.days);
  if (q.months) d.setMonth(d.getMonth() + q.months);
  return d;
}

function short(text: string, max = 130) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

const unitLabel = (d: Pick<Draft, "floor" | "door">) => formatUnit(d.floor, d.door) || "piso";
const placeLabel = (b: Building) => `${b.address}${b.city ? ` (${b.city})` : ""}`;
const when = (r: NonNullable<Reminder>) =>
  `${formatDate(r.date.toISOString())}${r.hasTime ? ` a las ${r.date.getHours()}:${String(r.date.getMinutes()).padStart(2, "0")}` : ""}`;

function callText(d: Draft) {
  return `Llamar a ${d.parsed.person ?? "el propietario"} · ${unitLabel(d)}, ${d.building.address}`;
}

function refresh(queryClient: QueryClient) {
  for (const key of ["buildings", "notifications", "dwelling-activities", "prospections", "prospect-calls", "activities-pending", "contacts", "contact", "dashboard-summary"]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

/** Si piden volver a llamar pero no se entendió cuándo, se ofrecen fechas en vez de abandonar. */
function pickDate(parsed: ParsedNote, onPick: (r: Reminder) => Reply | Promise<Reply>): Reply {
  return {
    text: parsed.reminderUnclear ? "Quieres volver a llamar, pero no he entendido cuándo. ¿Te aviso…?" : "¿Cuándo quieres que te avise?",
    choices: [
      ...QUICK_DATES.map((q) => ({ label: q.label, run: async () => onPick({ date: inFuture(q), hasTime: false }) })),
      { label: "Sin aviso", run: async () => onPick(null) },
    ],
  };
}

// ---------------------------------------------------------------- guardar en un piso

async function saveOnDwelling(d: Draft, queryClient: QueryClient): Promise<Reply> {
  let dwellingId = d.dwellingId;
  if (!dwellingId) {
    const created = await DwellingsApi.create({ buildingId: d.building.id, floor: d.floor, door: d.door, status: "CENSADA" });
    dwellingId = created.id;
  }
  await ProspectionsApi.quickNote(dwellingId, {
    note: d.parsed.note,
    callAt: d.reminder ? d.reminder.date.toISOString() : null,
    hasTime: d.reminder?.hasTime ?? false,
    callText: callText(d),
  });
  refresh(queryClient);
  return (
    `Hecho ✅ Guardé la nota en el historial del ${unitLabel(d)} de ${d.building.address}.` +
    (d.reminder ? `\nTe avisaré el ${formatDateTime(d.reminder.date.toISOString(), d.reminder.hasTime)}.` : "\nNo he creado ningún aviso.")
  );
}

function confirmDwelling(d: Draft, queryClient: QueryClient): Reply {
  const lines = [
    "Entendido:",
    `· Piso: ${unitLabel(d)} · ${placeLabel(d.building)}${d.dwellingId ? "" : " (todavía no estaba en el mapa: lo añado)"}`,
    d.parsed.person ? `· Hablaste con: ${d.parsed.person}` : null,
    `· Nota: «${short(d.parsed.note)}»`,
    d.reminder ? `· Aviso: ${when(d.reminder)} — «${callText(d)}»` : "· Aviso: ninguno (no has dicho cuándo volver a llamar)",
    "¿Lo guardo?",
  ].filter(Boolean);
  const choices: Choice[] = [
    { label: "Sí, guardar", run: () => saveOnDwelling(d, queryClient) },
    ...(d.reminder ? [] : [{ label: "Añadir un aviso", run: async () => pickDate({ ...d.parsed, reminderUnclear: false }, (r) => confirmDwelling({ ...d, reminder: r }, queryClient)) }]),
    { label: "No", run: async () => "Vale, no he guardado nada." },
  ];
  return { text: lines.join("\n"), choices };
}

function dwellingStep(d: Draft, queryClient: QueryClient): Reply {
  return !d.reminder && d.parsed.reminderUnclear
    ? pickDate(d.parsed, (r) => confirmDwelling({ ...d, reminder: r }, queryClient))
    : confirmDwelling(d, queryClient);
}

// ---------------------------------------------------------------- guardar sin piso

async function saveOnContact(contact: { id: string; name: string }, parsed: ParsedNote, reminder: Reminder, queryClient: QueryClient): Promise<Reply> {
  await ActivitiesApi.create({ type: "NOTA", description: parsed.note, contactId: contact.id });
  if (reminder) {
    await ActivitiesApi.create({ type: "LLAMADA", description: `Llamar a ${contact.name}`, contactId: contact.id, dueDate: reminder.date.toISOString(), hasTime: reminder.hasTime });
  }
  refresh(queryClient);
  return `Hecho ✅ Guardé la nota en la ficha de ${contact.name}.` + (reminder ? `\nTe avisaré el ${formatDateTime(reminder.date.toISOString(), reminder.hasTime)}.` : "");
}

async function saveReminderOnly(parsed: ParsedNote, reminder: NonNullable<Reminder>, queryClient: QueryClient): Promise<Reply> {
  await ActivitiesApi.create({
    type: "LLAMADA",
    description: `Llamar a ${parsed.person ?? "propietario"} — ${short(parsed.note, 200)}`,
    dueDate: reminder.date.toISOString(),
    hasTime: reminder.hasTime,
  });
  refresh(queryClient);
  return `Hecho ✅ Creé un recordatorio para el ${formatDateTime(reminder.date.toISOString(), reminder.hasTime)}: «Llamar a ${parsed.person ?? "propietario"}».`;
}

/** La persona no está en ningún piso: se ofrecen salidas (su ficha de contacto, un piso, solo un recordatorio) en vez de un callejón sin salida. */
async function personNotInMap(parsed: ParsedNote, input: string, original: string | undefined, buildings: Building[], pending: PendingRef, queryClient: QueryClient): Promise<Reply> {
  const person = parsed.person!;
  let contacts: { id: string; name: string }[] = [];
  try {
    contacts = (await ContactsApi.list(person.split(" ")[0])).filter((c) => wordsMatch(person, c.name)).slice(0, 3);
  } catch {
    contacts = [];
  }
  const choices: Choice[] = [
    ...contacts.map((c) => ({
      label: `Guardar en la ficha de ${c.name}`,
      run: async () =>
        parsed.reminder || !parsed.reminderUnclear ? saveOnContact(c, parsed, parsed.reminder, queryClient) : pickDate(parsed, (r) => saveOnContact(c, parsed, r, queryClient)),
    })),
    ...(contacts.length === 0
      ? [{
          label: `Crear el contacto «${person}»`,
          run: async (): Promise<Reply> => {
            const create = async (r: Reminder) => {
              const created = await ContactsApi.create({ name: person, source: "MANUAL" });
              return saveOnContact({ id: created.id, name: created.name }, parsed, r, queryClient);
            };
            return parsed.reminder || !parsed.reminderUnclear ? create(parsed.reminder) : pickDate(parsed, create);
          },
        }]
      : []),
    { label: "Es un piso del mapa", run: async () => askBuilding(parsed, input, original, buildings, pending, queryClient, "¿De qué edificio es?") },
    {
      label: "Solo un recordatorio",
      run: async () =>
        parsed.reminder ? saveReminderOnly(parsed, parsed.reminder, queryClient) : pickDate({ ...parsed, reminderUnclear: true }, (r) => (r ? saveReminderOnly(parsed, r, queryClient) : "Vale, no he guardado nada.")),
    },
    { label: "Cancelar", run: async () => "Vale, lo dejo." },
  ];
  const known = contacts.length ? ` Sí aparece en tus contactos${contacts.length > 1 ? " (hay varios parecidos)" : ""}.` : " Tampoco está en tus contactos.";
  return { text: `No encuentro a «${person}» como propietario de ningún piso del mapa.${known} ¿Qué hago con la nota?`, choices };
}

/** Pregunta el edificio con botones (los más probables) y deja escribir la dirección si no está. */
function askBuilding(parsed: ParsedNote, input: string, original: string | undefined, buildings: Building[], pending: PendingRef, queryClient: QueryClient, lead: string): Reply {
  pending.current = { text: input, original: original ?? input, awaiting: "building" };
  const list = [...buildings].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6);
  return {
    text: `${lead}\nElige uno o escríbeme la calle y el número (vale algo como «Toledo 21»).`,
    choices: [
      ...list.map((b) => ({ label: b.address, run: async () => withBuilding(parsed, b, input, pending, queryClient, original) })),
      { label: "No lo sé", run: async () => { pending.current = null; return noDwellingOptions(parsed, input, original, buildings, pending, queryClient); } },
    ],
  };
}

/** "No sé el piso": se guarda de otra forma, o se cancela. */
async function noDwellingOptions(parsed: ParsedNote, input: string, original: string | undefined, buildings: Building[], pending: PendingRef, queryClient: QueryClient): Promise<Reply> {
  if (parsed.person) return personNotInMap(parsed, input, original, buildings, pending, queryClient);
  return {
    text: "Sin saber el piso no puedo guardar la nota en el historial. ¿Quieres solo un recordatorio?",
    choices: [
      { label: "Solo un recordatorio", run: async () => (parsed.reminder ? saveReminderOnly(parsed, parsed.reminder, queryClient) : pickDate({ ...parsed, reminderUnclear: true }, (r) => (r ? saveReminderOnly(parsed, r, queryClient) : "Vale, no he guardado nada."))) },
      { label: "Cancelar", run: async () => "Vale, lo dejo." },
    ],
  };
}

function withBuilding(parsed: ParsedNote, building: Building, input: string, pending: PendingRef, queryClient: QueryClient, original?: string): Reply {
  if (!parsed.floor) {
    pending.current = { text: input, buildingId: building.id, original: original ?? input, awaiting: "unit" };
    const known = building.dwellings.filter((d) => d.floor || d.door).slice(0, 8);
    return {
      text: `Edificio: ${placeLabel(building)}.\n¿Qué piso es? Escríbeme la planta y la puerta (por ejemplo «3ºB» o «2 izquierda»)${known.length ? " o elige uno:" : "."}`,
      choices: known.map((d) => ({
        label: formatUnit(d.floor, d.door) || "Piso",
        run: async () => dwellingStep({ building, floor: d.floor ?? "", door: d.door ?? null, dwellingId: d.id, parsed, reminder: parsed.reminder }, queryClient),
      })),
    };
  }
  const found = findDwelling(parsed, building.dwellings);
  if (!found && !parsed.door) {
    // Planta sin puerta: si hay varias puertas en esa planta, se pregunta cuál.
    const sameFloor = building.dwellings.filter((x) => findDwelling({ floor: parsed.floor, door: x.door ?? null }, [x]));
    if (sameFloor.length > 1) {
      return {
        text: `En la planta ${parsed.floor} de ${building.address} hay varios pisos. ¿Cuál es?`,
        choices: sameFloor.map((x) => ({
          label: formatUnit(x.floor, x.door),
          run: async () => dwellingStep({ building, floor: parsed.floor!, door: x.door ?? null, dwellingId: x.id, parsed, reminder: parsed.reminder }, queryClient),
        })),
      };
    }
  }
  pending.current = null;
  return dwellingStep({ building, floor: parsed.floor, door: parsed.door, dwellingId: found?.id ?? null, parsed, reminder: parsed.reminder }, queryClient);
}

async function loadBuildings(queryClient: QueryClient) {
  return queryClient.fetchQuery({ queryKey: ["buildings", "assistant"], queryFn: () => BuildingsApi.list(), staleTime: 30_000 });
}

/**
 * Empieza o continúa una nota sobre un piso o un propietario. Siempre enseña lo que ha entendido
 * y pide confirmación antes de guardar nada; si algo no encaja, ofrece alternativas en vez de rendirse.
 */
export async function handleProspectNote(input: string, queryClient: QueryClient, pending: PendingRef, forcedBuildingId?: string, original?: string): Promise<Reply> {
  const parsed = parseProspectNote(input);
  if (original) parsed.note = original.trim().charAt(0).toUpperCase() + original.trim().slice(1);
  const data = await loadBuildings(queryClient);
  if (data.noOffice || data.buildings.length === 0) {
    pending.current = null;
    return "No tienes edificios a la vista en el mapa de viviendas, así que no puedo anotar ahí. Pide a un administrador que te dé acceso o que cargue el edificio.";
  }

  if (forcedBuildingId) {
    const b = data.buildings.find((x) => x.id === forcedBuildingId);
    if (b) return withBuilding(parsed, b, input, pending, queryClient, original);
  }

  const candidates = matchBuildings(parsed, data.buildings, input);
  if (candidates.length === 1) return withBuilding(parsed, candidates[0], input, pending, queryClient, original);
  if (candidates.length > 1) {
    pending.current = null;
    return {
      text: "Hay varios edificios que encajan. ¿Cuál es?",
      choices: candidates.slice(0, 5).map((b) => ({ label: placeLabel(b), run: async () => withBuilding(parsed, b, input, pending, queryClient, original) })),
    };
  }

  // Sin dirección: se busca a la persona entre los propietarios y residentes de los pisos del mapa.
  if (!parsed.street && !parsed.floor && parsed.person) {
    const people = findDwellingsByPerson(parsed.person, data.buildings);
    const draftFor = (m: (typeof people)[number]): Draft => ({
      building: m.building,
      floor: m.dwelling.floor ?? "",
      door: m.dwelling.door ?? null,
      dwellingId: m.dwelling.id,
      parsed,
      reminder: parsed.reminder,
    });
    if (people.length === 1) {
      pending.current = null;
      return dwellingStep(draftFor(people[0]), queryClient);
    }
    if (people.length > 1) {
      pending.current = null;
      return {
        text: `Hay varios pisos con alguien llamado «${parsed.person}». ¿Cuál es?`,
        choices: people.slice(0, 6).map((m) => ({
          label: `${formatUnit(m.dwelling.floor, m.dwelling.door) || "Piso"} · ${m.building.address}`,
          run: async () => dwellingStep(draftFor(m), queryClient),
        })),
      };
    }
    pending.current = null;
    return personNotInMap(parsed, input, original, data.buildings, pending, queryClient);
  }
  if (parsed.street) {
    const lead = `No encuentro «${[parsed.street, parsed.number].filter(Boolean).join(" ")}» entre los edificios del mapa. ¿Es alguno de estos?`;
    return askBuilding(parsed, input, original, data.buildings, pending, queryClient, lead);
  }
  return askBuilding(parsed, input, original, data.buildings, pending, queryClient, "Entendido. ¿De qué edificio hablas?");
}

/** Si el asistente había preguntado algo, la respuesta se junta con la frase original y se vuelve a leer. */
export async function continueProspectNote(answer: string, queryClient: QueryClient, pending: PendingRef): Promise<Reply> {
  const p = pending.current;
  if (!p) return "No tengo nada pendiente.";
  const original = p.original ?? p.text;
  const data = await loadBuildings(queryClient);
  const parsedOriginal = parseProspectNote(p.text);
  if (isDontKnow(answer)) {
    pending.current = null;
    return noDwellingOptions(parsedOriginal, p.text, original, data.buildings, pending, queryClient);
  }
  if (isCancel(answer)) {
    pending.current = null;
    return "Vale, lo dejo. No he guardado nada.";
  }

  // Esperaba la planta y la puerta: vale "2b", "2 b", "segundo izquierda"...
  if (p.awaiting === "unit" && p.buildingId) {
    const unit = parseUnitAnswer(answer);
    if (!unit) return `No he entendido el piso. Dime la planta y la puerta, por ejemplo «3ºB», «2 izquierda» o «bajo A». Si prefieres, escribe «no lo sé».`;
    pending.current = null;
    return handleProspectNote(`${p.text}, piso ${unit.floor}º${unit.door ?? ""}`, queryClient, pending, p.buildingId, original);
  }

  // Esperaba el edificio: primero como dirección completa, y si no, por palabras sueltas ("toledo", "el de toledo 21").
  const merged = `${p.text}, en ${answer}`;
  const full = parseProspectNote(merged);
  const byAddress = matchBuildings(full, data.buildings, answer);
  const found = byAddress.length ? byAddress : matchBuildingsByWords(answer, data.buildings);
  if (found.length === 1) {
    pending.current = null;
    return handleProspectNote(merged, queryClient, pending, found[0].id, original);
  }
  if (found.length > 1) {
    pending.current = null;
    return {
      text: "Hay varios edificios que encajan. ¿Cuál es?",
      choices: found.slice(0, 6).map((b) => ({
        label: placeLabel(b),
        run: async () => {
          pending.current = null;
          return handleProspectNote(merged, queryClient, pending, b.id, original);
        },
      })),
    };
  }
  return askBuilding(parsedOriginal, p.text, original, data.buildings, pending, queryClient, `No encuentro ningún edificio parecido a «${answer}».`);
}


// ---------------------------------------------------------------- buscar a una persona

const cap = (t: string) => t.trim().replace(/\s+/g, " ").replace(/(^|\s)(\S)/g, (_m, a, b) => a + b.toUpperCase());

async function saveCall(target: Target, reminder: NonNullable<Reminder>, queryClient: QueryClient): Promise<Reply> {
  if (target.kind === "contact") {
    await ActivitiesApi.create({ type: "LLAMADA", description: `Llamar a ${target.name}`, contactId: target.id, dueDate: reminder.date.toISOString(), hasTime: reminder.hasTime });
  } else {
    await ProspectionsApi.quickNote(target.id, {
      note: `Llamada programada con ${target.name}.`,
      callAt: reminder.date.toISOString(),
      hasTime: reminder.hasTime,
      callText: `Llamar a ${target.name} · ${target.place}`,
    });
  }
  refresh(queryClient);
  return `Hecho ✅ Te avisaré el ${formatDateTime(reminder.date.toISOString(), reminder.hasTime)} para llamar a ${target.name}.`;
}

async function saveNoteFor(target: Target, parsed: ParsedNote, reminder: Reminder, queryClient: QueryClient): Promise<Reply> {
  if (target.kind === "contact") return saveOnContact({ id: target.id, name: target.name }, parsed, reminder, queryClient);
  await ProspectionsApi.quickNote(target.id, {
    note: parsed.note,
    callAt: reminder ? reminder.date.toISOString() : null,
    hasTime: reminder?.hasTime ?? false,
    callText: `Llamar a ${target.name} · ${target.place}`,
  });
  refresh(queryClient);
  return `Hecho ✅ Guardé la nota en el historial de ${target.place}.` + (reminder ? `\nTe avisaré el ${formatDateTime(reminder.date.toISOString(), reminder.hasTime)}.` : "");
}

function confirmNoteFor(target: Target, parsed: ParsedNote, reminder: Reminder, queryClient: QueryClient): Reply {
  const lines = [
    `Entendido, para ${target.name}${target.kind === "dwelling" ? ` (${target.place})` : ""}:`,
    `· Nota: «${short(parsed.note)}»`,
    reminder ? `· Aviso: ${when(reminder)}` : "· Aviso: ninguno",
    "¿Lo guardo?",
  ];
  return {
    text: lines.join("\n"),
    choices: [
      { label: "Sí, guardar", run: () => saveNoteFor(target, parsed, reminder, queryClient) },
      ...(reminder ? [] : [{ label: "Añadir un aviso", run: async () => pickDate({ ...parsed, reminderUnclear: false }, (r) => confirmNoteFor(target, parsed, r, queryClient)) }]),
      { label: "No", run: async () => "Vale, no he guardado nada." },
    ],
  };
}

/** Qué se puede hacer con una persona ya elegida. */
function personActions(target: Target, pending: PendingRef, queryClient: QueryClient): Reply {
  return {
    text: `¿Qué hago con ${target.name}${target.kind === "dwelling" ? ` (${target.place})` : ""}?`,
    choices: [
      {
        label: "Anotar una conversación",
        run: async () => {
          pending.current = { text: "", awaiting: "note", target };
          return `Cuéntame qué habéis hablado con ${target.name}, como si se lo contaras a un compañero. Si dice cuándo volver a llamar («en un mes», «el lunes»), te dejo el aviso.`;
        },
      },
      { label: "Programar una llamada", run: async () => pickDate({ ...parseProspectNote(""), reminderUnclear: false }, (r) => (r ? saveCall(target, r, queryClient) : "Vale, no he programado nada.")) },
      { label: "Ver su ficha", href: target.kind === "contact" ? `/contactos/${target.id}` : `/mapa?vivienda=${target.id}` },
    ],
  };
}

/** Si lo escrito es un nombre ("carmen"), se busca entre contactos y propietarios de pisos y se ofrece qué hacer. */
export async function lookupPerson(term: string, queryClient: QueryClient, pending: PendingRef): Promise<Reply | null> {
  const query = term.replace(/^\s*(buscar|busca|b[uú]scame|encuentra|qui[eé]n es)\s+/i, "").trim();
  if (query.length < 2) return null;
  let contacts: { id: string; name: string; phone?: string | null }[] = [];
  try {
    contacts = (await ContactsApi.list(query.split(" ")[0])).filter((c) => wordsMatch(query, c.name)).slice(0, 5);
  } catch {
    contacts = [];
  }
  let owners: { building: Building; dwelling: Dwelling }[] = [];
  try {
    const data = await loadBuildings(queryClient);
    owners = findDwellingsByPerson<Dwelling, Building>(query, data.buildings).slice(0, 5);
  } catch {
    owners = [];
  }
  const targets: { label: string; target: Target }[] = [
    ...contacts.map((c) => ({ label: `${c.name} · contacto${c.phone ? ` · ${c.phone}` : ""}`, target: { kind: "contact", id: c.id, name: c.name } as Target })),
    ...owners.map((o) => {
      const place = `${formatUnit(o.dwelling.floor, o.dwelling.door) || "piso"} de ${o.building.address}`;
      const name = o.dwelling.contact?.name ?? o.dwelling.residents?.find((r) => wordsMatch(query, r.name))?.name ?? cap(query);
      return { label: `${name} · ${place}`, target: { kind: "dwelling", id: o.dwelling.id, name, place } as Target };
    }),
  ];
  if (targets.length === 0) {
    return {
      text: `No encuentro a «${cap(query)}» ni en tus contactos ni como propietario de ningún piso.`,
      choices: [
        {
          label: `Crear el contacto «${cap(query)}»`,
          run: async () => {
            const created = await ContactsApi.create({ name: cap(query), source: "MANUAL" });
            refresh(queryClient);
            return personActions({ kind: "contact", id: created.id, name: created.name }, pending, queryClient);
          },
        },
        { label: "No", run: async () => "Vale." },
      ],
    };
  }
  if (targets.length === 1) return personActions(targets[0].target, pending, queryClient);
  return {
    text: `He encontrado ${targets.length} coincidencias con «${query}». ¿Cuál es?`,
    choices: targets.map((t) => ({ label: t.label, run: async () => personActions(t.target, pending, queryClient) })),
  };
}

/** Respuesta a "cuéntame qué habéis hablado": se lee la nota y se pide confirmación. */
export async function continueNote(text: string, queryClient: QueryClient, pending: PendingRef): Promise<Reply> {
  const p = pending.current;
  if (!p?.target) return "No tengo nada pendiente.";
  pending.current = null;
  if (isCancel(text)) return "Vale, lo dejo. No he guardado nada.";
  const parsed = parseProspectNote(text);
  if (!parsed.reminder && parsed.reminderUnclear) {
    return pickDate(parsed, (r) => confirmNoteFor(p.target!, parsed, r, queryClient));
  }
  return confirmNoteFor(p.target, parsed, parsed.reminder, queryClient);
}
