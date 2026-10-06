import { prisma } from "./prisma.js";

/** Lo que se enseña de un usuario junto a un inmueble, tarea u oportunidad: nunca la fila entera (lleva el hash de la contraseña). */
export const safeUserSelect = { id: true, name: true, email: true, phone: true, photoUrl: true, jobTitle: true } as const;

/** Datos mínimos de la ficha de Propiedades que se ven desde la vivienda. */
export const propertyBriefSelect = { id: true, reference: true, title: true, type: true, listingType: true, status: true, price: true, bedrooms: true, bathrooms: true, areaM2: true } as const;

/**
 * Una vivienda y su ficha de Propiedades son el mismo piso: cuando cambia el estado de la ficha,
 * la vivienda lo refleja en el mapa (a la venta, en alquiler, vendida o de nuevo solo censada).
 */
export async function syncDwellingFromProperty(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { status: true, listingType: true } });
  if (!property) return;
  const dwellings = await prisma.dwelling.findMany({ where: { propertyId }, select: { id: true, status: true } });
  for (const d of dwellings) {
    let next = d.status;
    if (property.status === "VENDIDO") next = "VENDIDA";
    else if (property.status === "RETIRADO" && (d.status === "A_LA_VENTA" || d.status === "A_ALQUILER")) next = "CENSADA";
    else if ((property.status === "DISPONIBLE" || property.status === "RESERVADO") && d.status === "CENSADA") {
      next = property.listingType === "ALQUILER" ? "A_ALQUILER" : "A_LA_VENTA";
    }
    if (next !== d.status) await prisma.dwelling.update({ where: { id: d.id }, data: { status: next } });
  }
}
