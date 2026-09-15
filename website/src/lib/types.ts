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

export type ListingType = "VENTA" | "ALQUILER";
export type PropertyStatus = "DISPONIBLE" | "RESERVADO" | "VENDIDO" | "ALQUILADO" | "RETIRADO";
export type PropertyCondition = "NUEVO" | "BUEN_ESTADO" | "A_REFORMAR" | "REFORMADO";
export type HeatingType = "NINGUNA" | "INDIVIDUAL" | "CENTRAL";
export type EnergyRating = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "EN_TRAMITE" | "EXENTO";

export interface PublicAgent {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface PublicImage {
  id: string;
  url: string;
  order: number;
}

export interface PublicProperty {
  id: string;
  reference: string;
  title: string;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  condition?: PropertyCondition | null;
  price: number;
  hoaFees?: number | null;
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
  energyRating?: EnergyRating | null;
  energyConsumptionValue?: number | null;
  energyEmissionsRating?: EnergyRating | null;
  energyEmissionsValue?: number | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  images: PublicImage[];
  agent?: PublicAgent | null;
}

export interface PropertyDetailResponse extends PublicProperty {
  similar: PublicProperty[];
}

export interface PropertyListResponse {
  total: number;
  page: number;
  pageSize: number;
  properties: PublicProperty[];
}

export interface PublicAgentSummary {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  createdAt: string;
  propertiesCount: number;
  reviewsCount: number;
  averageRating: number | null;
}

export interface PublicAgentReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PublicAgentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  createdAt: string;
  properties: PublicProperty[];
  reviews: PublicAgentReview[];
  averageRating: number | null;
}

export interface PropertyFilters {
  type?: string;
  listingType?: string;
  city?: string;
  bedroomsMin?: string;
  priceMin?: string;
  priceMax?: string;
  q?: string;
  page?: string;
  pageSize?: string;
}
