export type PropertyType =
  | "PISO"
  | "CASA"
  | "CHALET"
  | "ATICO"
  | "LOCAL"
  | "OFICINA"
  | "GARAJE"
  | "TERRENO"
  | "OTRO";

export type ListingType = "VENTA" | "ALQUILER";
export type PropertyStatus = "DISPONIBLE" | "RESERVADO" | "VENDIDO" | "ALQUILADO" | "RETIRADO";
export type ContactSource = "WEB_HOUZEZ" | "MANUAL" | "WHATSAPP" | "EMAIL" | "PHONE" | "REFERRAL" | "OTHER";
export type ActivityType = "LLAMADA" | "EMAIL" | "WHATSAPP" | "VISITA" | "NOTA" | "TAREA";
export type DealStatus = "ABIERTO" | "GANADO" | "PERDIDO";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  phone?: string | null;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  deals?: Deal[];
}

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: ContactSource;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredZone?: string | null;
  propertyType?: PropertyType | null;
  listingType?: ListingType | null;
  notes?: string | null;
  createdAt: string;
  deals?: Deal[];
  activities?: Activity[];
}

export interface Property {
  id: string;
  reference: string;
  title: string;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: number;
  city?: string | null;
  zone?: string | null;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
  description?: string | null;
  agentId?: string | null;
  agent?: User | null;
  createdAt: string;
}

export interface Deal {
  id: string;
  contactId: string;
  propertyId?: string | null;
  stageId: string;
  agentId?: string | null;
  status: DealStatus;
  value?: number | null;
  expectedCloseDate?: string | null;
  notes?: string | null;
  contact?: Contact;
  property?: Property | null;
  stage?: PipelineStage;
  agent?: User | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  dueDate?: string | null;
  completed: boolean;
  contactId?: string | null;
  dealId?: string | null;
  agentId?: string | null;
  contact?: Contact | null;
  deal?: Deal | null;
  agent?: User | null;
  createdAt: string;
}

export interface Valuation {
  id: string;
  propertyId?: string | null;
  source: string;
  estimatedValue: number;
  factors?: { avgPricePerM2: number; comparablesCount: number } | null;
  createdAt: string;
}

export interface DashboardSummary {
  contactsCount: number;
  propertiesAvailable: number;
  openDeals: number;
  wonDeals: number;
  pendingActivities: number;
  dealsByStage: { id: string; name: string; _count: { deals: number } }[];
}
