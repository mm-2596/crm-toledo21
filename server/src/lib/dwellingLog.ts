import { prisma } from "./prisma.js";

/** Los hitos automáticos se guardan como notas que empiezan por esta marca; el CRM las enseña como hitos y no como texto escrito a mano. */
export const AUTO_PREFIX = "[Auto] ";

const STATUS: Record<string, string> = {
  CENSADA: "Censada",
  A_LA_VENTA: "A la venta",
  VENDIDA: "Vendida",
  ALQUILADA: "Alquilada",
  A_ALQUILER: "En alquiler",
};
const STAGE: Record<string, string> = {
  ENCARGO_VIGENTE: "Encargo vigente",
  RESERVADO: "Reservado",
  ARRAS: "Arras firmadas",
  PENDIENTE_ESCRITURA: "Pendiente de escritura",
  FIRMADO_NOTARIO: "Firmado ante notario",
};
const PROSPECT: Record<string, string> = {
  EN_SEGUIMIENTO: "En seguimiento",
  CAPTADO: "Captado (nota de encargo)",
  DESCARTADO: "Descartado",
};

const euros = (n: number | null) => (n == null ? "sin precio" : `${new Intl.NumberFormat("es-ES").format(n)} €`);

interface Snapshot {
  status: string;
  saleStage: string | null;
  prospectStatus: string | null;
  price: number | null;
  agentId: string | null;
  contactId: string | null;
}

/** Anota en la hoja de seguimiento de la vivienda los cambios importantes, para que cualquier compañero vea cómo ha ido sin preguntar. */
export async function logDwellingChanges(dwellingId: string, before: Snapshot, after: Snapshot, userId: string) {
  const lines: string[] = [];
  if (before.status !== after.status) lines.push(`Estado: ${STATUS[before.status] ?? before.status} → ${STATUS[after.status] ?? after.status}`);
  if (before.saleStage !== after.saleStage) {
    lines.push(after.saleStage ? `Fase de venta: ${STAGE[after.saleStage] ?? after.saleStage}` : "Fase de venta: retirada");
  }
  if (before.prospectStatus !== after.prospectStatus) {
    lines.push(after.prospectStatus ? `Prospección: ${PROSPECT[after.prospectStatus] ?? after.prospectStatus}` : "Prospección: retirada");
  }
  if (before.price !== after.price) lines.push(`Precio: ${euros(before.price)} → ${euros(after.price)}`);
  if (before.agentId !== after.agentId || before.contactId !== after.contactId) {
    const [agent, owner] = await Promise.all([
      before.agentId !== after.agentId && after.agentId ? prisma.user.findUnique({ where: { id: after.agentId }, select: { name: true } }) : null,
      before.contactId !== after.contactId && after.contactId ? prisma.contact.findUnique({ where: { id: after.contactId }, select: { name: true } }) : null,
    ]);
    if (before.agentId !== after.agentId) lines.push(after.agentId ? `Comercial asignado: ${agent?.name ?? "otra persona"}` : "Comercial: sin asignar");
    if (before.contactId !== after.contactId) lines.push(after.contactId ? `Propietario: ${owner?.name ?? "otro contacto"}` : "Propietario: sin asignar");
  }
  if (!lines.length) return;
  await prisma.activity.createMany({
    data: lines.map((line) => ({ type: "NOTA" as const, description: AUTO_PREFIX + line, completed: true, dwellingId, agentId: userId })),
  });
}

export async function logDwellingEvent(dwellingId: string, text: string, userId: string) {
  await prisma.activity.create({ data: { type: "NOTA", description: AUTO_PREFIX + text, completed: true, dwellingId, agentId: userId } });
}
