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

export type Role = "ADMIN" | "AGENT" | "ADMINISTRACION";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  photoUrl?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  office?: Office | null;
  canViewBuildings?: boolean;
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
  segment?: ClientSegment | null;
  savings?: number | null;
  monthlyIncome?: number | null;
  monthlyDebts?: number | null;
  priority?: ContactPriority | null;
  notes?: string | null;
  marketingConsent?: boolean;
  marketingConsentAt?: string | null;
  whatsappConsent?: boolean;
  birthMonth?: number | null;
  birthDay?: number | null;
  unsubscribedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  deals?: Deal[];
  activities?: Activity[];
  searches?: ContactSearch[];
  affordability?: { maxPrice: number | null; note: string; listingType: ListingType };
}

export type ClientSegment = "BUSCA_COMPRAR" | "BUSCA_ALQUILER" | "HA_COMPRADO" | "PROPIETARIO" | "INQUILINO";

export interface ContactSearch {
  id: string;
  contactId?: string;
  propertyType: PropertyType;
  listingType: ListingType;
  budgetMin?: number | null;
  budgetMax?: number | null;
  zones?: string | null;
  bedroomsMin?: number | null;
  bathroomsMin?: number | null;
  areaMin?: number | null;
  notes?: string | null;
  active: boolean;
}

export type ContactSearchInput = Omit<ContactSearch, "id" | "contactId" | "active"> & { active?: boolean };

export type PriceBand = "OK" | "NARANJA" | "ROJO" | "SIN_PRESUPUESTO";
export type Viability = "VIABLE" | "JUSTO" | "NO_VIABLE" | "SIN_DATOS";

export interface MatchItem {
  contactId: string;
  name: string;
  phone: string | null;
  email: string | null;
  priority: string | null;
  band: PriceBand;
  deviationPct: number;
  budget: string;
  search: string;
  viability: Viability;
  viabilityDetail: string;
  warnings: string[];
}

export interface MatchesResponse {
  price: number | null;
  listingType: ListingType;
  needsPrice?: boolean;
  matches: MatchItem[];
}

export interface Visit {
  id: string;
  description: string;
  dueDate: string;
  location?: string | null;
  contact?: { id: string; name: string; phone?: string | null } | null;
  agent?: { id: string; name: string } | null;
  property?: { id: string; reference: string; title: string } | null;
  dwelling?: { id: string; buildingId: string; label: string } | null;
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
  dwelling?: { id: string; buildingId: string; label: string } | null;
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
  dwelling: { id: string; buildingId: string; label: string } | null;
  leaseId?: string | null;
}

export interface NotificationsResponse {
  count: number;
  items: NotificationItem[];
}

export type Office = "GETAFE" | "LEGANES" | "LAS_ROZAS" | "PUERTO_SAGUNTO";
export type DwellingStatus = "CENSADA" | "A_LA_VENTA" | "VENDIDA" | "ALQUILADA" | "A_ALQUILER";

export type SaleStage = "ENCARGO_VIGENTE" | "RESERVADO" | "ARRAS" | "PENDIENTE_ESCRITURA" | "FIRMADO_NOTARIO";
export type ResidentRole = "PROPIETARIO" | "INQUILINO" | "HIJO_PROPIETARIO" | "FAMILIAR" | "OTRO";

export interface DwellingResident {
  id: string;
  dwellingId: string;
  name: string;
  role: ResidentRole;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface ResidentInput {
  name: string;
  role: ResidentRole;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface DwellingFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface PropertyBrief {
  id: string;
  reference: string;
  title: string;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
}

export interface ContactLinks {
  dwellings: { id: string; status: DwellingStatus; label: string }[];
  leases: { id: string; status: LeaseStatus; monthlyRent: number; role: "PROPIETARIO" | "INQUILINO"; label: string }[];
  visits: { id: string; dueDate: string; location?: string | null; label: string; property?: { id: string } | null; dwellingId?: string | null }[];
}

export interface Dwelling {
  id: string;
  buildingId: string;
  floor?: string | null;
  door?: string | null;
  status: DwellingStatus;
  contactId?: string | null;
  contact?: { id: string; name: string } | null;
  notes?: string | null;
  saleStage?: SaleStage | null;
  saleStageAt?: string | null;
  residents: DwellingResident[];
  files: DwellingFile[];
  property?: PropertyBrief | null;
  propertyId?: string | null;
  leases?: { id: string; status: LeaseStatus; monthlyRent: number; endDate?: string | null; tenant?: { name: string } | null }[];
  price?: number | null;
  propertyType?: PropertyType | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  office: Office;
  latitude: number;
  longitude: number;
  dwellings: Dwelling[];
}

export interface BuildingInput {
  name: string;
  address: string;
  city?: string | null;
  office: Office;
  latitude: number;
  longitude: number;
}

export interface DwellingInput {
  floor?: string | null;
  door?: string | null;
  status?: DwellingStatus;
  contactId?: string | null;
  notes?: string | null;
  saleStage?: SaleStage | null;
  propertyId?: string | null;
  price?: number | null;
  propertyType?: PropertyType | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
}

export type LeaseStatus = "VIGENTE" | "FINALIZADO";

export interface LeaseParty {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface Lease {
  id: string;
  dwellingId: string;
  ownerId?: string | null;
  tenantId?: string | null;
  monthlyRent: number;
  deposit?: number | null;
  startDate: string;
  endDate?: string | null;
  status: LeaseStatus;
  notes?: string | null;
  dwelling: { id: string; floor?: string | null; door?: string | null; building: { id: string; name: string; address: string; city?: string | null; office: Office } };
  owner?: LeaseParty | null;
  tenant?: LeaseParty | null;
  files: DwellingFile[];
}

export interface LeaseInput {
  ownerId?: string | null;
  tenantId?: string | null;
  monthlyRent: number;
  deposit?: number | null;
  startDate: string;
  endDate?: string | null;
  status?: LeaseStatus;
  notes?: string | null;
}

export interface TeamTask {
  id: string;
  type: ActivityType;
  description: string;
  dueDate: string | null;
  hasTime: boolean;
  createdAt: string;
  state: NotificationState | null;
  contact: { id: string; name: string } | null;
  leaseId?: string | null;
  dwelling: { id: string; buildingId: string; label: string } | null;
}

export interface TeamOverviewUser {
  id: string;
  name: string;
  role: Role;
  office?: Office | null;
  overdue: TeamTask[];
  today: TeamTask[];
  upcoming: TeamTask[];
  recent: TeamTask[];
}

export interface GreetingTexts {
  subject: string;
  body: string;
  whatsappText: string;
  enabled: boolean;
  customized: boolean;
}

export interface Festivity {
  key: string;
  name: string;
  theme: string;
  date: string;
  daysLeft: number;
  occasion: string;
  template: GreetingTexts;
  whatsappSent: number;
}

export interface FestivitiesResponse {
  festivities: Festivity[];
  birthday: { key: string; template: GreetingTexts };
  audience: { email: number; whatsapp: number };
}

export interface BirthdayItem {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  month: number;
  day: number;
  daysLeft: number;
  emailConsent: boolean;
  emailSent: boolean;
  whatsappSent: boolean;
  whatsappUrl: string | null;
}

export interface WhatsappRecipient {
  id: string;
  name: string;
  phone: string | null;
  sent: boolean;
  url: string | null;
}
