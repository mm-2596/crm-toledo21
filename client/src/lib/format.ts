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
  LOCAL: "Local",
  OFICINA: "Oficina",
  GARAJE: "Garaje",
  TERRENO: "Terreno",
  OTRO: "Otro",
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

export const activityTypeLabels: Record<string, string> = {
  LLAMADA: "Llamada",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  VISITA: "Visita",
  NOTA: "Nota",
  TAREA: "Tarea",
};
