import type { Prisma } from "@prisma/client";

/** Administración solo ve a la gente del mundo del alquiler: quien busca piso, propietarios, inquilinos y quien figura en un contrato. */
export function rentalContactWhere(): Prisma.ContactWhereInput {
  return {
    OR: [
      { segment: { in: ["BUSCA_ALQUILER", "PROPIETARIO", "INQUILINO"] } },
      { ownerLeases: { some: {} } },
      { tenantLeases: { some: {} } },
      { searches: { some: { listingType: "ALQUILER" } } },
    ],
  };
}
