export function formatCurrency(value?: number | null) {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
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

export const propertyConditionLabels: Record<string, string> = {
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

export const listingTypeLabels: Record<string, string> = {
  VENTA: "Venta",
  ALQUILER: "Alquiler",
};

export const propertyStatusLabels: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
  ALQUILADO: "Alquilado",
  RETIRADO: "Retirado",
};

export const statusBadgeClasses: Record<string, string> = {
  DISPONIBLE: "bg-emerald-50 text-emerald-700",
  RESERVADO: "bg-amber-50 text-amber-700",
  VENDIDO: "bg-slate-100 text-slate-600",
  ALQUILADO: "bg-slate-100 text-slate-600",
  RETIRADO: "bg-red-50 text-red-600",
};

export const contactSourceLabels: Record<string, string> = {
  WEB_HOUZEZ: "Web",
  MANUAL: "Manual",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  PHONE: "Teléfono",
  REFERRAL: "Referido",
  OTHER: "Otro",
};

export const priorityLabels: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const priorityBadgeClasses: Record<string, string> = {
  ALTA: "bg-red-50 text-red-600",
  MEDIA: "bg-amber-50 text-amber-700",
  BAJA: "bg-slate-100 text-slate-600",
};

export const energyRatingLabels: Record<string, string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  EN_TRAMITE: "En trámite",
  EXENTO: "Exento",
};

export const energyRatingBadgeClasses: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700",
  B: "bg-emerald-50 text-emerald-700",
  C: "bg-lime-50 text-lime-700",
  D: "bg-amber-50 text-amber-700",
  E: "bg-orange-50 text-orange-700",
  F: "bg-red-50 text-red-600",
  G: "bg-red-50 text-red-600",
  EN_TRAMITE: "bg-slate-100 text-slate-600",
  EXENTO: "bg-slate-100 text-slate-600",
};

export const activityTypeLabels: Record<string, string> = {
  LLAMADA: "Llamada",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  VISITA: "Visita",
  NOTA: "Nota",
  TAREA: "Tarea",
};
