export type PropertyType =
  | "PISO"
  | "CASA"
  | "CHALET"
  | "ATICO"
  | "DUPLEX"
  | "ESTUDIO"
  | "LOCAL"
  | "OFICINA"
  | "GARAJE"
  | "TERRENO"
  | "NAVE_INDUSTRIAL"
  | "TRASTERO"
  | "OTRO";

export type PropertyCondition = "NUEVO" | "BUEN_ESTADO" | "A_REFORMAR" | "REFORMADO";
export type HeatingType = "NINGUNA" | "INDIVIDUAL" | "CENTRAL";
export type ListingType = "VENTA" | "ALQUILER";
export type PropertyStatus = "DISPONIBLE" | "RESERVADO" | "VENDIDO" | "ALQUILADO" | "RETIRADO";
export type ContactSource = "WEB_HOUZEZ" | "MANUAL" | "WHATSAPP" | "EMAIL" | "PHONE" | "REFERRAL" | "OTHER";
export type ActivityType = "LLAMADA" | "EMAIL" | "WHATSAPP" | "VISITA" | "REUNION" | "NOTA" | "TAREA";
export type DealStatus = "ABIERTO" | "GANADO" | "PERDIDO";
export type ContactPriority = "ALTA" | "MEDIA" | "BAJA";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  phone?: string | null;
  photoUrl?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
}

export interface TeamMember extends User {
  active: boolean;
  createdAt: string;
}

export interface AgentReview {
  id: string;
  agentId: string;
  authorName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
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
  bedroomsMin?: number | null;
  needsFinancing?: boolean | null;
  priority?: ContactPriority | null;
  notes?: string | null;
  marketingConsent?: boolean;
  marketingConsentAt?: string | null;
  unsubscribedAt?: string | null;
  createdAt: string;
  deals?: Deal[];
  activities?: Activity[];
}

export type CampaignStatus = "BORRADOR" | "ENVIANDO" | "ENVIADA";

export interface CampaignSegment {
  sources?: ContactSource[];
  listingType?: ListingType;
  propertyType?: PropertyType;
  priority?: ContactPriority;
  zone?: string;
  onlyValuations?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  segment?: CampaignSegment | null;
  status: CampaignStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  sentAt?: string | null;
  sends?: { id: string; email: string; error?: string | null }[];
}

export interface CampaignInput {
  name: string;
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  segment: CampaignSegment;
}

export interface AudienceInfo {
  count: number;
  withoutConsent: number;
  unsubscribed: number;
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
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
  usableAreaM2?: number | null;
  floor?: number | null;
  hasElevator?: boolean | null;
  energyRating?: EnergyRating | null;
  energyConsumptionValue?: number | null;
  energyEmissionsRating?: EnergyRating | null;
  energyEmissionsValue?: number | null;
  condition?: PropertyCondition | null;
  yearBuilt?: number | null;
  parkingSpaces?: number | null;
  heating?: HeatingType | null;
  hasAirConditioning?: boolean | null;
  hasTerrace?: boolean | null;
  hasBalcony?: boolean | null;
  hasGarden?: boolean | null;
  hasPool?: boolean | null;
  hasStorageRoom?: boolean | null;
  isFurnished?: boolean | null;
  isExterior?: boolean | null;
  hoaFees?: number | null;
  description?: string | null;
  agentId?: string | null;
  agent?: User | null;
  images?: PropertyImage[];
  videos?: PropertyVideo[];
  createdAt: string;
}

export type EnergyRating = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "EN_TRAMITE" | "EXENTO";

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface PropertyVideo {
  id: string;
  propertyId: string;
  url: string;
  order: number;
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
  hasTime?: boolean;
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

export type NotificationState = "overdue" | "soon" | "today" | "upcoming";

export interface NotificationItem {
  id: string;
  type: ActivityType;
  description: string;
  dueDate: string;
  hasTime: boolean;
  state: NotificationState;
  unassigned: boolean;
  contact: { id: string; name: string } | null;
}

export interface NotificationsResponse {
  count: number;
  items: NotificationItem[];
}
