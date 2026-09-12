export function formatCurrency(value?: number | null) {
  if (value == null) return "Consultar precio";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export const propertyTypeLabels: Record<string, string> = {
  PISO: "Piso",
  CASA: "Casa",
  CHALET: "Chalet",
  ATICO: "Ático",
  DUPLEX: "Dúplex",
  ESTUDIO: "Estudio",
  LOCAL: "Local comercial",
  OFICINA: "Oficina",
  GARAJE: "Garaje",
  TERRENO: "Terreno",
  NAVE_INDUSTRIAL: "Nave industrial",
  TRASTERO: "Trastero",
  OTRO: "Otro",
};

export const listingTypeLabels: Record<string, string> = {
  VENTA: "Venta",
  ALQUILER: "Alquiler",
};

export const conditionLabels: Record<string, string> = {
  NUEVO: "Nuevo / a estrenar",
  BUEN_ESTADO: "Buen estado",
  A_REFORMAR: "A reformar",
  REFORMADO: "Reformado",
};

export const heatingLabels: Record<string, string> = {
  NINGUNA: "Sin calefacción",
  INDIVIDUAL: "Individual",
  CENTRAL: "Central",
};

export const statusLabels: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
  ALQUILADO: "Alquilado",
  RETIRADO: "Retirado",
};
