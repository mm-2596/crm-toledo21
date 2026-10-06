import { prisma } from "./prisma.js";

/**
 * Festividades en las que se felicita a los clientes. Los textos de aquí son los de partida:
 * la oficina puede retocarlos (se guardan en GreetingTemplate) y se personalizan con {{nombre}}.
 */
export type FestivityRule = { month: number; day: number } | "PALM_SUNDAY" | "MOTHERS_DAY";

export interface FestivityDef {
  key: string;
  name: string;
  rule: FestivityRule;
  theme: string;
  subject: string;
  body: string;
  whatsappText: string;
}

const SIGN = "Un abrazo,\nel equipo de Toledo21";

export const FESTIVITIES: FestivityDef[] = [
  {
    key: "ANIO_NUEVO",
    name: "Año Nuevo",
    rule: { month: 1, day: 1 },
    theme: "ANIO_NUEVO",
    subject: "Feliz Año Nuevo, {{nombre}}",
    body: `Hola {{nombre}},\n\nEmpieza un año nuevo y queremos desearte lo mejor: salud, buenos momentos y que todos tus proyectos, también los de casa, salgan adelante.\n\nGracias por confiar en nosotros. Estamos aquí para lo que necesites.\n\n${SIGN}`,
    whatsappText: "¡Hola {{nombre}}! Desde Toledo21 te deseamos un muy feliz Año Nuevo. Que este año venga cargado de salud y de buenos proyectos. Aquí estamos para lo que necesites. Un abrazo.",
  },
  {
    key: "REYES",
    name: "Reyes Magos",
    rule: { month: 1, day: 6 },
    theme: "REYES",
    subject: "Feliz día de Reyes, {{nombre}}",
    body: `Hola {{nombre}},\n\nQue los Reyes Magos te traigan mucha ilusión, buena compañía y, por qué no, la casa con la que sueñas.\n\nGracias por estar con nosotros.\n\n${SIGN}`,
    whatsappText: "¡Hola {{nombre}}! Feliz día de Reyes de parte de todo el equipo de Toledo21. Que se cumplan todos tus deseos. Un abrazo.",
  },
  {
    key: "DIA_PADRE",
    name: "Día del Padre",
    rule: { month: 3, day: 19 },
    theme: "DIA_PADRE",
    subject: "Feliz Día del Padre, {{nombre}}",
    body: `Hola {{nombre}},\n\nHoy es un día para celebrar a los padres. Te mandamos un abrazo enorme y nuestros mejores deseos para ti y tu familia.\n\n${SIGN}`,
    whatsappText: "¡Hola {{nombre}}! Feliz Día del Padre. Te mandamos un abrazo enorme desde Toledo21 y los mejores deseos para toda tu familia.",
  },
  {
    key: "SEMANA_SANTA",
    name: "Semana Santa",
    rule: "PALM_SUNDAY",
    theme: "SEMANA_SANTA",
    subject: "Feliz Semana Santa, {{nombre}}",
    body: `Hola {{nombre}},\n\nLlegan unos días de descanso y queremos que los disfrutes en buena compañía, en casa o donde más te apetezca.\n\nCerramos algún día por festivo, pero seguimos a tu disposición para lo que necesites.\n\n${SIGN}`,
    whatsappText: "¡Hola {{nombre}}! Te deseamos una feliz Semana Santa y unos días de descanso en buena compañía. Un abrazo de todo el equipo de Toledo21.",
  },
  {
    key: "DIA_MADRE",
    name: "Día de la Madre",
    rule: "MOTHERS_DAY",
    theme: "DIA_MADRE",
    subject: "Feliz Día de la Madre, {{nombre}}",
    body: `Hola {{nombre}},\n\nFeliz Día de la Madre. Te mandamos un abrazo muy fuerte y los mejores deseos para hoy y para siempre.\n\n${SIGN}`,
    whatsappText: "¡Hola {{nombre}}! Feliz Día de la Madre de parte de todo el equipo de Toledo21. Un abrazo muy fuerte.",
  },
  {
    key: "VERANO",
    name: "Verano",
    rule: { month: 6, day: 21 },
    theme: "VERANO",
    subject: "Llega el verano, {{nombre}}",
    body: `Hola {{nombre}},\n\nEmpieza el verano y toca descansar, desconectar y disfrutar. Que lo pases genial.\n\nSi estás pensando en comprar, vender o alquilar, el verano también es buen momento: cuenta con nosotros.\n\n${SIGN}`,
    whatsappText: "¡Hola {{nombre}}! Ya está aquí el verano. Que descanses y lo disfrutes mucho. Si necesitas algo, estamos en Toledo21. Un abrazo.",
  },
  {
    key: "NAVIDAD",
    name: "Navidad",
    rule: { month: 12, day: 24 },
    theme: "NAVIDAD",
    subject: "Feliz Navidad, {{nombre}}",
    body: `Hola {{nombre}},\n\nEstas fiestas queremos darte las gracias por tu confianza y desearte una feliz Navidad rodeado de los tuyos.\n\nQue el próximo año venga lleno de salud y de buenas noticias.\n\n${SIGN}`,
    whatsappText: "¡Hola {{nombre}}! Desde Toledo21 te deseamos una muy feliz Navidad y un próspero año nuevo. Gracias por confiar en nosotros. Un abrazo.",
  },
];

export const BIRTHDAY_DEFAULT = {
  key: "CUMPLEANOS",
  theme: "CUMPLEANOS",
  subject: "¡Feliz cumpleaños, {{nombre}}!",
  body: `Hola {{nombre}},\n\nHoy es tu día y no queríamos dejar pasar la ocasión de felicitarte. Que lo disfrutes muchísimo, rodeado de los tuyos.\n\nGracias por formar parte de la familia de Toledo21.\n\n${SIGN}`,
  whatsappText: "¡Hola {{nombre}}! Hoy es tu cumpleaños y en Toledo21 nos hemos acordado de ti. ¡Muchas felicidades! Que lo disfrutes mucho. Un abrazo.",
};

// --- Fechas ---

/** Domingo de Pascua (algoritmo gregoriano de Meeus/Jones/Butcher). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export function festivityDate(rule: FestivityRule, year: number): Date {
  if (rule === "PALM_SUNDAY") return new Date(easterSunday(year).getTime() - 7 * 86_400_000);
  if (rule === "MOTHERS_DAY") {
    const first = new Date(Date.UTC(year, 4, 1));
    return new Date(Date.UTC(year, 4, 1 + ((7 - first.getUTCDay()) % 7)));
  }
  return new Date(Date.UTC(year, rule.month - 1, rule.day));
}

/** Próxima vez que cae la festividad desde `today` (AAAA-MM-DD, hora de Madrid), incluido hoy. */
export function nextOccurrence(def: FestivityDef, today: string): { date: Date; year: number; daysLeft: number } {
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const year = Number(today.slice(0, 4));
  let date = festivityDate(def.rule, year);
  if (date.getTime() < todayMs) date = festivityDate(def.rule, year + 1);
  return { date, year: date.getUTCFullYear(), daysLeft: Math.round((date.getTime() - todayMs) / 86_400_000) };
}

// --- Textos ---

export function personalize(text: string, name: string): string {
  const first = name.trim().split(/\s+/)[0] || "";
  return text.replace(/\{\{\s*nombre\s*\}\}/gi, first);
}

export interface GreetingTexts {
  subject: string;
  body: string;
  whatsappText: string;
  enabled: boolean;
  customized: boolean;
}

export async function templateFor(key: string): Promise<GreetingTexts> {
  const base = key === BIRTHDAY_DEFAULT.key ? BIRTHDAY_DEFAULT : FESTIVITIES.find((f) => f.key === key);
  if (!base) throw new Error(`Festividad desconocida: ${key}`);
  const custom = await prisma.greetingTemplate.findUnique({ where: { key } });
  return {
    subject: custom?.subject || base.subject,
    body: custom?.body || base.body,
    whatsappText: custom?.whatsappText || base.whatsappText,
    enabled: custom?.enabled ?? true,
    customized: Boolean(custom && (custom.subject || custom.body || custom.whatsappText)),
  };
}

/** Número en formato internacional para wa.me, o null si no parece un teléfono válido (se asume España si son 9 cifras). */
export function whatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    // ya trae prefijo
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.length === 9) {
    digits = `34${digits}`;
  }
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
}

// --- Cumpleaños ---

/** Quién cumple años entre hoy y los próximos `days` días (misma lógica de calendario, sin año). */
export function birthdayDaysLeft(month: number, day: number, today: string): number {
  const year = Number(today.slice(0, 4));
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const at = (y: number) => {
    // El 29 de febrero se celebra el 28 en los años que no son bisiestos.
    const isLeap = new Date(Date.UTC(y, 1, 29)).getUTCMonth() === 1;
    return Date.UTC(y, month - 1, month === 2 && day === 29 && !isLeap ? 28 : day);
  };
  let target = at(year);
  if (target < todayMs) target = at(year + 1);
  return Math.round((target - todayMs) / 86_400_000);
}
