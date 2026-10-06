import { Router } from "express";
import type { Request } from "express";
import type { Office, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAdmin } from "../lib/auth.js";
import { csvCell } from "../lib/csv.js";
import { affordability } from "../lib/matching.js";
import { PROPERTY_TYPES, canUse, officeAccess } from "./buildings.js";
import { rentalContactWhere } from "../lib/contactScope.js";
import { dwellingActivityInclude, dwellingLabel } from "../lib/notifications.js";

const searchInput = z.object({
  propertyType: z.enum(PROPERTY_TYPES),
  listingType: z.enum(["VENTA", "ALQUILER"]),
  budgetMin: z.number().int().min(0).optional().nullable(),
  budgetMax: z.number().int().min(0).optional().nullable(),
  zones: z.string().trim().max(200).optional().nullable(),
  bedroomsMin: z.number().int().min(0).max(50).optional().nullable(),
  bathroomsMin: z.number().int().min(0).max(50).optional().nullable(),
  areaMin: z.number().int().min(0).max(100_000).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  active: z.boolean().optional(),
});

export const contactsRouter = Router();

const RENTAL_SEGMENTS = ["BUSCA_ALQUILER", "PROPIETARIO", "INQUILINO"] as const;
const SEGMENTS = ["BUSCA_COMPRAR", "BUSCA_ALQUILER", "HA_COMPRADO", "PROPIETARIO", "INQUILINO"] as const;

/** Administración solo ve a la gente del mundo del alquiler: quien busca piso, propietarios e inquilinos. */
function rentalScope(req: Request): Prisma.ContactWhereInput {
  return req.user!.role === "ADMINISTRACION" ? rentalContactWhere() : {};
}

const contactInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  source: z
    .enum(["WEB_HOUZEZ", "MANUAL", "WHATSAPP", "EMAIL", "PHONE", "REFERRAL", "OTHER"])
    .optional(),
  budgetMin: z.number().int().optional().nullable(),
  budgetMax: z.number().int().optional().nullable(),
  preferredZone: z.string().optional().nullable(),
  propertyType: z.enum(PROPERTY_TYPES).optional().nullable(),
  segment: z.enum(SEGMENTS).optional().nullable(),
  savings: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  monthlyIncome: z.number().int().min(0).max(10_000_000).optional().nullable(),
  monthlyDebts: z.number().int().min(0).max(10_000_000).optional().nullable(),
  listingType: z.enum(["VENTA", "ALQUILER"]).optional().nullable(),
  bedroomsMin: z.number().int().optional().nullable(),
  needsFinancing: z.boolean().optional().nullable(),
  priority: z.enum(["ALTA", "MEDIA", "BAJA"]).optional().nullable(),
  notes: z.string().optional().nullable(),
  marketingConsent: z.boolean().optional(),
  whatsappConsent: z.boolean().optional(),
  birthMonth: z.number().int().min(1).max(12).optional().nullable(),
  birthDay: z.number().int().min(1).max(31).optional().nullable(),
});

/** Día y mes van juntos y el día debe existir en ese mes (el 29 de febrero vale). */
function birthdayProblem(v: { birthMonth?: number | null; birthDay?: number | null }): string | null {
  if (v.birthMonth === undefined && v.birthDay === undefined) return null;
  if ((v.birthMonth == null) !== (v.birthDay == null)) return "Indica el día y el mes del cumpleaños";
  if (v.birthMonth != null && v.birthDay != null && v.birthDay > [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][v.birthMonth - 1]) return "Ese día no existe en ese mes";
  return null;
}

/** Al dar el consentimiento se registra la fecha y se anula una baja anterior; al retirarlo, deja de recibir campañas. */
function withConsentDates<T extends { marketingConsent?: boolean; whatsappConsent?: boolean }>(data: T) {
  const out: T & { marketingConsentAt?: Date; unsubscribedAt?: null; whatsappConsentAt?: Date | null } = { ...data };
  if (data.marketingConsent === true) {
    out.marketingConsentAt = new Date();
    out.unsubscribedAt = null;
  }
  if (data.whatsappConsent === true) out.whatsappConsentAt = new Date();
  if (data.whatsappConsent === false) out.whatsappConsentAt = null;
  return out;
}

contactsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, segment, type } = req.query;
    const contacts = await prisma.contact.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { name: { contains: String(q), mode: "insensitive" } },
                  { email: { contains: String(q), mode: "insensitive" } },
                  { phone: { contains: String(q) } },
                ],
              }
            : {},
          rentalScope(req),
          SEGMENTS.some((s) => s === segment) ? { segment: segment as "BUSCA_COMPRAR" } : {},
          PROPERTY_TYPES.some((t) => t === type) ? { OR: [{ searches: { some: { propertyType: type as "PISO", active: true } } }, { searches: { none: {} }, propertyType: type as "PISO" }] } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { deals: { include: { stage: true } }, searches: { where: { active: true }, select: { id: true, propertyType: true, listingType: true } } },
    });
    res.json(contacts);
  }),
);

// Solo administradores: es la base de clientes completa. Debe ir antes de "/:id".
contactsRouter.get(
  "/export",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const onlyConsent = req.query.consent === "1";
    const contacts = await prisma.contact.findMany({
      where: onlyConsent
        ? { marketingConsent: true, unsubscribedAt: null, email: { not: null }, NOT: { email: "" } }
        : undefined,
      orderBy: { createdAt: "desc" },
      select: { name: true, email: true, phone: true, source: true, preferredZone: true, createdAt: true, marketingConsent: true, unsubscribedAt: true },
    });

    const sourceLabels: Record<string, string> = {
      WEB_HOUZEZ: "Web", MANUAL: "Manual", WHATSAPP: "WhatsApp", EMAIL: "Email", PHONE: "Teléfono", REFERRAL: "Referido", OTHER: "Otro",
    };
    const header = ["Nombre", "Email", "Teléfono", "Origen", "Zona", "Fecha de alta", "Acepta emails", "Baja"];
    const rows = contacts.map((c) => [
      c.name,
      c.email,
      c.phone,
      sourceLabels[c.source] ?? c.source,
      c.preferredZone,
      c.createdAt.toISOString().slice(0, 10),
      c.marketingConsent ? "Sí" : "No",
      c.unsubscribedAt ? "Sí" : "No",
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n") + "\r\n";

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="contactos-toledo21${onlyConsent ? "-con-consentimiento" : ""}-${stamp}.csv"`);
    res.setHeader("Cache-Control", "no-store");
    res.send(csv);
  }),
);

contactsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const contact = await prisma.contact.findFirst({
      where: { AND: [{ id: String(req.params.id) }, rentalScope(req)] },
      include: {
        deals: { include: { stage: true, property: true } },
        activities: { orderBy: { createdAt: "desc" } },
        searches: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!contact) return res.status(404).json({ error: "Contacto no encontrado" });
    // Lo que podría permitirse, para la primera búsqueda de compra (o alquiler si solo busca alquilar).
    const listing = contact.segment === "BUSCA_ALQUILER" || (contact.searches[0]?.listingType === "ALQUILER" && contact.segment !== "BUSCA_COMPRAR") ? "ALQUILER" : "VENTA";
    res.json({ ...contact, affordability: { ...affordability(contact, listing), listingType: listing } });
  }),
);

/**
 * Sugerencia de propiedades para un lead ya cualificado (matching por reglas:
 * mismo tipo de operacion/inmueble, zona, presupuesto y habitaciones minimas).
 * Es la funcion que en la demo de Inmovilla aparece como "te paso 3 opciones"
 * justo despues de cualificar un lead.
 */
contactsRouter.get(
  "/:id/matches",
  asyncHandler(async (req, res) => {
    if (req.user!.role === "ADMINISTRACION") return res.status(403).json({ error: "Tu perfil solo gestiona alquileres" });
    const contact = await prisma.contact.findUnique({ where: { id: String(req.params.id) } });
    if (!contact) return res.status(404).json({ error: "Contacto no encontrado" });

    if (!contact.propertyType && !contact.preferredZone && !contact.budgetMax) {
      return res.json([]);
    }

    const properties = await prisma.property.findMany({
      where: {
        status: "DISPONIBLE",
        type: contact.propertyType ?? undefined,
        listingType: contact.listingType ?? undefined,
        price: contact.budgetMax ? { lte: contact.budgetMax } : undefined,
        bedrooms: contact.bedroomsMin ? { gte: contact.bedroomsMin } : undefined,
      },
      orderBy: { price: "desc" },
      take: 20,
    });

    const zone = contact.preferredZone?.toLowerCase().trim();
    const sorted = zone
      ? [...properties].sort((a, b) => {
          const aMatch = a.zone?.toLowerCase().includes(zone) ? 1 : 0;
          const bMatch = b.zone?.toLowerCase().includes(zone) ? 1 : 0;
          return bMatch - aMatch;
        })
      : properties;

    res.json(sorted.slice(0, 3));
  }),
);

/**
 * Todo lo que une a esta persona con el resto del CRM: sus viviendas del mapa, sus alquileres (como propietario o
 * inquilino) y sus próximas visitas. Solo se enseña lo de las oficinas a las que el usuario tiene acceso.
 */
contactsRouter.get(
  "/:id/links",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await prisma.contact.findFirst({ where: { AND: [{ id }, rentalScope(req)] }, select: { id: true } }))) return res.status(404).json({ error: "Contacto no encontrado" });
    const access = await officeAccess(req);
    const role = req.user!.role;
    const dwellingSelect = { id: true, buildingId: true, floor: true, door: true, status: true, building: { select: { name: true, office: true } } } as const;

    const [dwellings, leases, visits] = await Promise.all([
      prisma.dwelling.findMany({ where: { contactId: id }, select: dwellingSelect }),
      role === "AGENT" ? Promise.resolve([]) : prisma.lease.findMany({ where: { OR: [{ ownerId: id }, { tenantId: id }] }, select: { id: true, status: true, monthlyRent: true, ownerId: true, dwelling: { select: dwellingSelect } }, orderBy: { createdAt: "desc" } }),
      prisma.activity.findMany({
        where: {
          AND: [
            { contactId: id, type: "VISITA", completed: false, dueDate: { gte: new Date(Date.now() - 12 * 3600_000) } },
            role === "ADMIN" ? {} : { OR: [{ dwellingId: null }, { agentId: req.user!.userId }] },
            role === "ADMINISTRACION"
              ? { OR: [{ property: { listingType: "ALQUILER" } }, { dwelling: { status: { in: ["A_ALQUILER", "ALQUILADA"] } } }, { dwelling: { property: { listingType: "ALQUILER" } } }] }
              : {},
          ],
        },
        orderBy: { dueDate: "asc" },
        include: { property: { select: { id: true, reference: true, title: true } }, dwelling: dwellingActivityInclude },
      }),
    ]);
    const visible = (d: { building: { office: Office } }) => canUse(access, d.building.office);
    res.json({
      dwellings: dwellings.filter(visible).map((d) => ({ id: d.id, status: d.status, label: dwellingLabel(d) })),
      leases: leases
        .filter((l) => visible(l.dwelling))
        .map((l) => ({ id: l.id, status: l.status, monthlyRent: l.monthlyRent, role: l.ownerId === id ? "PROPIETARIO" : "INQUILINO", label: dwellingLabel(l.dwelling) })),
      visits: visits.map((v) => ({
        id: v.id,
        dueDate: v.dueDate,
        location: v.location,
        label: v.property ? `${v.property.reference} · ${v.property.title}` : v.dwelling ? dwellingLabel(v.dwelling) : "Visita",
        property: v.property,
        dwellingId: v.dwellingId,
      })),
    });
  }),
);

contactsRouter.post(
  "/:id/searches",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!(await prisma.contact.findFirst({ where: { AND: [{ id }, rentalScope(req)] }, select: { id: true } }))) return res.status(404).json({ error: "Contacto no encontrado" });
    const data = searchInput.parse(req.body);
    if (req.user!.role === "ADMINISTRACION" && data.listingType !== "ALQUILER") return res.status(403).json({ error: "Tu perfil solo gestiona búsquedas de alquiler" });
    res.status(201).json(await prisma.contactSearch.create({ data: { ...data, zones: data.zones || null, notes: data.notes || null, contactId: id } }));
  }),
);

contactsRouter.put(
  "/searches/:sid",
  asyncHandler(async (req, res) => {
    const data = searchInput.parse(req.body);
    const sid = String(req.params.sid);
    if (!(await prisma.contactSearch.findUnique({ where: { id: sid }, select: { id: true } }))) return res.status(404).json({ error: "Búsqueda no encontrada" });
    res.json(await prisma.contactSearch.update({ where: { id: sid }, data: { ...data, zones: data.zones || null, notes: data.notes || null } }));
  }),
);

contactsRouter.delete(
  "/searches/:sid",
  asyncHandler(async (req, res) => {
    await prisma.contactSearch.deleteMany({ where: { id: String(req.params.sid) } });
    res.status(204).send();
  }),
);

contactsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = contactInput.parse(req.body);
    const birthdayError = birthdayProblem(data);
    if (birthdayError) return res.status(400).json({ error: birthdayError });
    // Lo que da de alta Administración entra en su mundo (alquiler); si no se indica, busca alquilar.
    if (req.user!.role === "ADMINISTRACION" && !(data.segment && RENTAL_SEGMENTS.some((s) => s === data.segment))) data.segment = "BUSCA_ALQUILER";
    const contact = await prisma.contact.create({ data: withConsentDates(data) });
    res.status(201).json(contact);
  }),
);

contactsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = contactInput.partial().parse(req.body);
    const birthdayError = birthdayProblem(data);
    if (birthdayError) return res.status(400).json({ error: birthdayError });
    if (!(await prisma.contact.findFirst({ where: { AND: [{ id: String(req.params.id) }, rentalScope(req)] }, select: { id: true } }))) return res.status(404).json({ error: "Contacto no encontrado" });
    if (req.user!.role === "ADMINISTRACION" && data.segment && !RENTAL_SEGMENTS.some((s) => s === data.segment)) return res.status(403).json({ error: "Tu perfil solo gestiona alquileres" });
    const contact = await prisma.contact.update({
      where: { id: String(req.params.id) },
      data: withConsentDates(data),
    });
    res.json(contact);
  }),
);

contactsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.user!.role === "ADMINISTRACION") return res.status(403).json({ error: "Solo un administrador puede borrar contactos" });
    await prisma.contact.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);
