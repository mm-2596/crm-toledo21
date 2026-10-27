import type { QueryClient } from "@tanstack/react-query";
import { BuildingsApi, DwellingsApi, ProspectionsApi } from "../api/endpoints";
import { formatDate, formatDateTime } from "../lib/format";
import { findDwelling, findDwellingsByPerson, formatUnit, matchBuildings, parseProspectNote, type ParsedNote } from "../lib/prospectNote";
import type { Building } from "../api/types";

export interface Choice {
  label: string;
  run: () => Promise<Reply>;
}
export type Reply = string | { text: string; choices?: Choice[] };

/** Lo que falta por preguntar: el asistente guarda la frase y la completa con la respuesta siguiente. */
export interface PendingProspect {
  text: string;
  buildingId?: string;
  /** La frase tal como la escribió la persona: es la que se guarda como nota, sin las respuestas añadidas después. */
  original?: string;
}
export type PendingRef = { current: PendingProspect | null };

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
  reminder: { date: Date; hasTime: boolean } | null;
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

function callText(d: Draft) {
  return `Llamar a ${d.parsed.person ?? "el propietario"} · ${unitLabel(d)}, ${d.building.address}`;
}

async function save(d: Draft, queryClient: QueryClient): Promise<Reply> {
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
  for (const key of ["buildings", "notifications", "dwelling-activities", "prospections", "prospect-calls", "activities-pending"]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
  return (
    `Hecho ✅ Guardé la nota en el historial del ${unitLabel(d)} de ${d.building.address}.` +
    (d.reminder ? `\nTe avisaré el ${formatDateTime(d.reminder.date.toISOString(), d.reminder.hasTime)}.` : "\nNo he creado ningún aviso.")
  );
}

function confirm(d: Draft, queryClient: QueryClient): Reply {
  const lines = [
    "Entendido:",
    `· Piso: ${unitLabel(d)} · ${placeLabel(d.building)}${d.dwellingId ? "" : " (todavía no estaba en el mapa: lo añado)"}`,
    d.parsed.person ? `· Hablaste con: ${d.parsed.person}` : null,
    `· Nota: «${short(d.parsed.note)}»`,
    d.reminder
      ? `· Aviso: ${formatDate(d.reminder.date.toISOString())}${d.reminder.hasTime ? ` a las ${d.reminder.date.getHours()}:${String(d.reminder.date.getMinutes()).padStart(2, "0")}` : ""} — «${callText(d)}»`
      : "· Aviso: ninguno (no has dicho cuándo volver a llamar)",
    "¿Lo guardo?",
  ].filter(Boolean);
  const choices: Choice[] = [
    { label: "Sí, guardar", run: () => save(d, queryClient) },
    ...(d.reminder ? [] : [{ label: "Añadir un aviso", run: async () => askDate(d, queryClient) }]),
    { label: "No", run: async () => "Vale, no he guardado nada." },
  ];
  return { text: lines.join("\n"), choices };
}

function askDate(d: Draft, queryClient: QueryClient): Reply {
  return {
    text: d.parsed.reminderUnclear
      ? "Quieres volver a llamar, pero no he entendido cuándo. ¿Te aviso…?"
      : "¿Cuándo quieres que te avise?",
    choices: [
      ...QUICK_DATES.map((q) => ({ label: q.label, run: async () => confirm({ ...d, reminder: { date: inFuture(q), hasTime: false } }, queryClient) })),
      { label: "Sin aviso", run: async () => confirm({ ...d, reminder: null, parsed: { ...d.parsed, reminderUnclear: false } }, queryClient) },
    ],
  };
}

function withReminderStep(d: Draft, queryClient: QueryClient): Reply {
  return !d.reminder && d.parsed.reminderUnclear ? askDate(d, queryClient) : confirm(d, queryClient);
}

function withBuilding(parsed: ParsedNote, building: Building, input: string, pending: PendingRef, queryClient: QueryClient, original?: string): Reply {
  if (!parsed.floor) {
    pending.current = { text: input, buildingId: building.id, original: original ?? input };
    return `Edificio: ${placeLabel(building)}.\n¿Qué piso es? Dime la planta y la puerta, por ejemplo «3ºB».`;
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
          run: async () => withReminderStep({ building, floor: parsed.floor!, door: x.door ?? null, dwellingId: x.id, parsed, reminder: parsed.reminder }, queryClient),
        })),
      };
    }
  }
  pending.current = null;
  return withReminderStep(
    { building, floor: parsed.floor, door: parsed.door, dwellingId: found?.id ?? null, parsed, reminder: parsed.reminder },
    queryClient,
  );
}

/**
 * Empieza o continúa una nota de captación escrita al asistente. Siempre enseña lo que ha entendido
 * y pide confirmación antes de guardar nada.
 */
export async function handleProspectNote(input: string, queryClient: QueryClient, pending: PendingRef, forcedBuildingId?: string, original?: string): Promise<Reply> {
  const parsed = parseProspectNote(input);
  if (original) parsed.note = original.trim().charAt(0).toUpperCase() + original.trim().slice(1);
  const data = await queryClient.fetchQuery({ queryKey: ["buildings", "assistant"], queryFn: () => BuildingsApi.list(), staleTime: 30_000 });
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
      return withReminderStep(draftFor(people[0]), queryClient);
    }
    if (people.length > 1) {
      pending.current = null;
      return {
        text: `Hay varios pisos con alguien llamado «${parsed.person}». ¿Cuál es?`,
        choices: people.slice(0, 6).map((m) => ({
          label: `${formatUnit(m.dwelling.floor, m.dwelling.door) || "Piso"} · ${m.building.address}`,
          run: async () => withReminderStep(draftFor(m), queryClient),
        })),
      };
    }
    pending.current = { text: input, original };
    return `No encuentro a «${parsed.person}» como propietario en ningún piso del mapa. ¿De qué edificio hablas? Dime la calle y el número, por ejemplo «Calle Mayor 5».`;
  }
  if (parsed.street) {
    pending.current = null;
    return `No encuentro ningún edificio con «${[parsed.street, parsed.number].filter(Boolean).join(" ")}» en el mapa de viviendas. Revisa la dirección o crea primero el edificio desde el Mapa.`;
  }
  pending.current = { text: input, original };
  return "Entendido. ¿De qué edificio hablas? Dime la calle y el número, por ejemplo «Calle Mayor 5».";
}

/** Si el asistente había preguntado algo, la respuesta se junta con la frase original y se vuelve a leer. */
export async function continueProspectNote(answer: string, queryClient: QueryClient, pending: PendingRef): Promise<Reply> {
  const p = pending.current;
  if (!p) return "No tengo nada pendiente.";
  const merged = p.buildingId ? `${p.text}, piso ${answer}` : `${p.text}, en ${answer}`;
  const buildingId = p.buildingId;
  const original = p.original ?? p.text;
  pending.current = null;
  return handleProspectNote(merged, queryClient, pending, buildingId, original);
}
