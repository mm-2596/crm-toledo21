// Lee una nota rápida de captación escrita en lenguaje normal y saca de ella el piso, la persona
// con la que se habló y cuándo volver a llamar. Funciona por reglas (sin IA): si no entiende algo,
// lo deja vacío y el asistente lo pregunta, nunca se inventa un dato.
//
// Ejemplo: "He hablado con Paca del 3ºB de Calle Mayor 5 y me ha dicho que la llame en un mes".

export interface ParsedReminder {
  date: Date;
  hasTime: boolean;
}

export interface ParsedNote {
  floor: string | null;
  door: string | null;
  /** Calle tal como se escribió ("Calle Mayor") y su número, si los hay. */
  street: string | null;
  number: string | null;
  person: string | null;
  reminder: ParsedReminder | null;
  /** La frase pide volver a llamar pero no se entendió cuándo. */
  reminderUnclear: boolean;
  note: string;
}

export function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ºª ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ORDINALS: Record<string, string> = {
  primero: "1", segundo: "2", tercero: "3", cuarto: "4", quinto: "5", sexto: "6", septimo: "7",
  octavo: "8", noveno: "9", decimo: "10", bajo: "Bajo", atico: "Ático", entresuelo: "Entresuelo",
};

const DOOR_WORDS: Record<string, string> = {
  izq: "IZQ", izda: "IZQ", izquierda: "IZQ", izquierdo: "IZQ",
  dcha: "DCHA", der: "DCHA", derecha: "DCHA", derecho: "DCHA",
  centro: "CENTRO", exterior: "EXT", ext: "EXT", interior: "INT", int: "INT",
};

/** Normaliza una puerta para poder comparar "b", "B" o "izquierda" con lo guardado. */
export function normDoor(door: string | null | undefined): string {
  if (!door) return "";
  const d = norm(door).replace(/\s+/g, "");
  return DOOR_WORDS[d] ?? d.toUpperCase();
}

export function normFloor(floor: string | null | undefined): string {
  if (!floor) return "";
  const f = norm(floor).replace(/^0+(?=\d)/, "").replace(/^planta\s*/, "");
  const fromWord = ORDINALS[f];
  return (fromWord ?? f).toUpperCase();
}

function validDoor(token: string | undefined): string | null {
  if (!token) return null;
  const t = norm(token);
  if (DOOR_WORDS[t]) return DOOR_WORDS[t];
  if (/^[a-h]$/.test(t)) return t.toUpperCase();
  if (/^\d{1,2}$/.test(t)) return t;
  return null;
}

/** Planta y puerta: "3ºB", "3º B", "3º izquierda", "tercero B", "piso 3B", "el 2 izquierda". */
function parseUnit(text: string): { floor: string | null; door: string | null; raw: string | null } {
  let m = text.match(/\b(\d{1,2})\s*[ºª°]\s*[-.]?\s*([A-Za-zñÑ]{1,10}|\d{1,2})?(?![A-Za-zñ])/);
  if (m) return { floor: m[1], door: validDoor(m[2]), raw: m[0] };

  m = text.match(/\b(primero|segundo|tercero|cuarto|quinto|sexto|s[eé]ptimo|octavo|noveno|d[eé]cimo|bajo|[aá]tico|entresuelo)\b(?:\s+([A-Za-zñÑ]{1,10}))?/i);
  if (m) {
    const key = norm(m[1]);
    return { floor: ORDINALS[key] ?? null, door: validDoor(m[2]), raw: m[0] };
  }

  m = text.match(/\b(?:piso|el|del|la|de la)\s+(\d{1,2})\s?([A-Ha-h]|izquierda|izq|derecha|dcha|centro)\b/i);
  if (m) return { floor: m[1], door: validDoor(m[2]), raw: m[0].replace(/^(?:piso|el|del|la|de la)\s+/i, "") };

  return { floor: null, door: null, raw: null };
}

const STREET_WORD = "calle|c\\/|c\\.|avenida|avda\\.?|av\\.?|plaza|pza\\.?|paseo|ronda|camino|travesia|travesía|carretera|urbanizaci[oó]n|bulevar|glorieta";
const NAME_PART = "(?:(?:de\\s+(?:la\\s+|los\\s+|las\\s+|el\\s+)?|del\\s+|la\\s+|el\\s+)?[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.'-]+)";

function parseAddress(text: string): { street: string | null; number: string | null } {
  const re = new RegExp(`\\b(${STREET_WORD})\\s+(${NAME_PART}(?:\\s+${NAME_PART}){0,3}?)\\s*,?\\s*(?:n[ºo°]?\\.?\\s*)?(\\d{1,4})\\b`, "i");
  const m = text.match(re);
  if (m) return { street: `${m[1]} ${m[2]}`.replace(/\s+/g, " ").trim(), number: m[3] };
  const noNumber = text.match(new RegExp(`\\b(${STREET_WORD})\\s+(${NAME_PART}(?:\\s+${NAME_PART}){0,2})`, "i"));
  if (noNumber) {
    // Sin número: se corta antes de la primera palabra que ya no parece parte del nombre de la calle.
    const words = noNumber[2].split(/\s+/);
    const stop = words.findIndex((w) => /^(y|que|me|ha|dice|dijo|con|para|en|se|del|de)$/i.test(w) && words.indexOf(w) > 0 && !/^(de|del)$/i.test(w));
    const kept = (stop === -1 ? words : words.slice(0, stop)).slice(0, 3);
    return { street: `${noNumber[1]} ${kept.join(" ")}`.trim(), number: null };
  }
  return { street: null, number: null };
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, quince: 15, veinte: 20, treinta: 30,
};
const WEEKDAYS: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMonths(base: Date, n: number) {
  const d = new Date(base);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

const CUE = /\b(ll[aá]m(?!ad[oa]s?\b)(?:e|ar|a)\w*|vuelv\w*|volver\w*|av[ií]s\w*|record\w*|contact(?:e|ar)\w*|pas(?:e|ar)\w*|quedar\w*|hablar\w*|insist\w*|retom\w*)\b/i;

/** Cuándo volver a llamar: "en un mes", "dentro de 15 días", "mañana", "el lunes", "el 20/12"... */
function parseReminder(text: string, now: Date): { reminder: ParsedReminder | null; unclear: boolean } {
  const hasCue = CUE.test(text) || /\b(dentro de|en|de aqui a)\s+(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|\d{1,3})\s+(d[ií]as?|semanas?|mes(?:es)?|a[ñn]os?)\b/i.test(text);
  if (!hasCue) return { reminder: null, unclear: false };
  const today = startOfDay(now);
  let date: Date | null = null;

  const rel = text.match(/\b(?:dentro de|en|de aqu[ií] a)\s+(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|\d{1,3})\s+(d[ií]as?|semanas?|mes(?:es)?|a[ñn]os?)\b/i);
  if (rel) {
    const n = NUMBER_WORDS[rel[1].toLowerCase()] ?? Number(rel[1]);
    const unit = norm(rel[2]);
    if (unit.startsWith("dia")) date = new Date(today.getTime() + n * 86_400_000);
    else if (unit.startsWith("semana")) date = new Date(today.getTime() + n * 7 * 86_400_000);
    else if (unit.startsWith("mes")) date = addMonths(today, n);
    else date = addMonths(today, n * 12);
  } else if (/\bpasado\s+ma[ñn]ana\b/i.test(text)) {
    date = new Date(today.getTime() + 2 * 86_400_000);
  } else if (/\bma[ñn]ana\b/i.test(text)) {
    date = new Date(today.getTime() + 86_400_000);
  } else if (/\bla\s+semana\s+(?:que\s+viene|pr[oó]xima)\b/i.test(text)) {
    date = new Date(today.getTime() + 7 * 86_400_000);
  } else if (/\bel\s+mes\s+(?:que\s+viene|pr[oó]ximo)\b/i.test(text)) {
    date = addMonths(today, 1);
  } else if (/\b(?:el\s+)?a[ñn]o\s+(?:que\s+viene|pr[oó]ximo)\b/i.test(text)) {
    date = addMonths(today, 12);
  } else {
    const wd = text.match(/\b(?:el\s+|para\s+el\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i);
    const dm = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (dm) {
      const y = dm[3] ? (Number(dm[3]) < 100 ? 2000 + Number(dm[3]) : Number(dm[3])) : today.getFullYear();
      const d = new Date(y, Number(dm[2]) - 1, Number(dm[1]));
      if (!dm[3] && d < today) d.setFullYear(y + 1);
      if (d.getMonth() === Number(dm[2]) - 1) date = d;
    } else if (wd) {
      const target = WEEKDAYS[norm(wd[1])];
      const diff = (target - today.getDay() + 7) % 7 || 7;
      date = new Date(today.getTime() + diff * 86_400_000);
    }
  }
  if (!date) return { reminder: null, unclear: true };

  let hasTime = false;
  const t = text.match(/\ba\s+las\s+([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\b/i) ?? text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (t) {
    date.setHours(Number(t[1]), Number(t[2] ?? 0), 0, 0);
    hasTime = true;
  }
  return { reminder: { date, hasTime }, unclear: false };
}

function parsePerson(text: string): string | null {
  const verb = text.match(/\b(?:hablado|habl[eé]|charlado|charl[eé]|llamado|llam[eé]|visitado|visit[eé]|estado|estuve|quedado|qued[eé])\s+(?:con|a)\s+/i);
  if (!verb || verb.index === undefined) return null;
  const rest = text.slice(verb.index + verb[0].length);
  const m = rest.match(/^(?:(?:el|la)\s+)?(?:se[ñn]or(?:a)?\s+|don\s+|do[ñn]a\s+)?([A-ZÁÉÍÓÚÑ][\p{L}'-]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}'-]+)?)/u);
  return m ? m[1] : null;
}

export function parseProspectNote(text: string, now: Date = new Date()): ParsedNote {
  const clean = text.trim().replace(/\s+/g, " ");
  const unit = parseUnit(clean);
  // La planta y la puerta se quitan antes de buscar la calle para no confundir "3ºB" con el número del portal.
  const withoutUnit = unit.raw ? clean.replace(unit.raw, " ") : clean;
  const address = parseAddress(withoutUnit);
  const { reminder, unclear } = parseReminder(clean, now);
  return {
    floor: unit.floor,
    door: unit.door,
    street: address.street,
    number: address.number,
    person: parsePerson(clean),
    reminder,
    reminderUnclear: unclear,
    note: clean.charAt(0).toUpperCase() + clean.slice(1),
  };
}

/**
 * ¿Parece una nota de captación? Hace falta haber hablado/llamado/visitado y, además, o bien nombrar un piso
 * o una calle, o bien pedir volver a llamar a una persona ("he hablado con Carmen y me ha dicho que la llame en un mes").
 */
export function looksLikeProspectNote(text: string): boolean {
  if (!/\b(he\s+hablado|habl[eé]|he\s+llamado|llam[eé]|he\s+visitado|visit[eé]|he\s+estado|estuve|he\s+quedado|qued[eé]|he\s+charlado|charl[eé])\b/i.test(text)) return false;
  const p = parseProspectNote(text);
  if (p.floor || p.street || /\b(vecin[oa]|propietari[oa]|due[ñn][oa]|portal|edificio)\b/i.test(text)) return true;
  return Boolean(p.person && (p.reminder || p.reminderUnclear));
}

export function formatUnit(floor?: string | null, door?: string | null): string {
  if (!floor && !door) return "";
  if (floor && /^\d+$/.test(floor)) return `${floor}º${door ? ` ${door}` : ""}`.trim();
  return [floor, door].filter(Boolean).join(" ");
}

export interface BuildingLike {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  dwellings: { id: string; floor?: string | null; door?: string | null }[];
}

const SKIP_WORDS = new Set(["calle", "c", "avenida", "avda", "av", "plaza", "pza", "paseo", "ronda", "camino", "travesia", "carretera", "urbanizacion", "bulevar", "glorieta", "de", "del", "la", "las", "los", "el", "n", "numero"]);

/** Edificios que encajan con la calle y el número escritos, del que mejor encaja al que peor. */
export function matchBuildings<T extends BuildingLike>(parsed: Pick<ParsedNote, "street" | "number">, buildings: T[], rawText = ""): T[] {
  const hayOf = (b: T) => ` ${norm(`${b.name} ${b.address}`)} `;
  const scored: { b: T; score: number }[] = [];
  if (parsed.street) {
    const tokens = norm(parsed.street).split(" ").filter((t) => t.length > 1 && !SKIP_WORDS.has(t));
    for (const b of buildings) {
      const hay = hayOf(b);
      if (tokens.length === 0 || !tokens.every((t) => hay.includes(` ${t} `) || hay.includes(` ${t}`))) continue;
      let score = 2;
      if (parsed.number) {
        if (hay.includes(` ${parsed.number} `) || hay.includes(` ${parsed.number},`) || new RegExp(`\\b${parsed.number}\\b`).test(hay)) score += 2;
        else continue;
      }
      scored.push({ b, score });
    }
  }
  if (scored.length === 0 && rawText) {
    // Por si el edificio se nombra tal cual ("Edificio Los Pinos").
    const text = ` ${norm(rawText)} `;
    for (const b of buildings) {
      const name = norm(b.name);
      if (name.length >= 5 && text.includes(` ${name} `)) scored.push({ b, score: 3 });
    }
  }
  return scored.sort((x, y) => y.score - x.score).map((x) => x.b);
}

/** El piso de ese edificio que corresponde a la planta y la puerta escritas. */
export function findDwelling<T extends { id: string; floor?: string | null; door?: string | null }>(
  parsed: Pick<ParsedNote, "floor" | "door">,
  dwellings: T[],
): T | null {
  if (!parsed.floor) return null;
  const floor = normFloor(parsed.floor);
  const door = normDoor(parsed.door);
  const sameFloor = dwellings.filter((d) => normFloor(d.floor) === floor);
  if (door) return sameFloor.find((d) => normDoor(d.door) === door) ?? null;
  return sameFloor.length === 1 ? sameFloor[0] : null;
}

export interface PersonMatch<B, D> {
  building: B;
  dwelling: D;
}

/** Pisos cuyo propietario, residente o cliente se llama así (todas las palabras del nombre escrito deben aparecer). */
export function findDwellingsByPerson<
  D extends { id: string; floor?: string | null; door?: string | null; contact?: { name: string } | null; residents?: { name: string }[] },
  B extends { dwellings: D[] },
>(person: string, buildings: B[]): PersonMatch<B, D>[] {
  const words = norm(person).split(" ").filter((w) => w.length > 1);
  if (words.length === 0) return [];
  const out: PersonMatch<B, D>[] = [];
  for (const building of buildings) {
    for (const dwelling of building.dwellings) {
      const names = [dwelling.contact?.name, ...(dwelling.residents ?? []).map((r) => r.name)].filter(Boolean) as string[];
      if (names.some((n) => {
        const hay = ` ${norm(n)} `;
        return words.every((w) => hay.includes(` ${w} `) || hay.includes(` ${w}`));
      })) out.push({ building, dwelling });
    }
  }
  return out;
}
