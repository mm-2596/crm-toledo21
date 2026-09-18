import { useState } from "react";
import {
  energyRatingLabels,
  heatingLabels,
  listingTypeLabels,
  propertyConditionLabels,
  propertyTypeLabels,
} from "../lib/format";
import type { Property } from "../api/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400";
const labelClass = "mb-1 block text-xs font-medium text-slate-500";

interface AmenityOption {
  key: keyof PropertyFormValues;
  label: string;
}

const AMENITIES: AmenityOption[] = [
  { key: "hasAirConditioning", label: "Aire acondicionado" },
  { key: "hasTerrace", label: "Terraza" },
  { key: "hasBalcony", label: "Balcón" },
  { key: "hasGarden", label: "Jardín" },
  { key: "hasPool", label: "Piscina" },
  { key: "hasStorageRoom", label: "Trastero" },
  { key: "isFurnished", label: "Amueblado" },
  { key: "isExterior", label: "Exterior" },
  { key: "hasElevator", label: "Ascensor" },
];

export interface PropertyFormValues {
  reference: string;
  title: string;
  type: string;
  listingType: string;
  price: string;
  city: string;
  zone: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  areaM2: string;
  usableAreaM2: string;
  floor: string;
  yearBuilt: string;
  condition: string;
  parkingSpaces: string;
  heating: string;
  hoaFees: string;
  energyRating: string;
  energyConsumptionValue: string;
  energyEmissionsRating: string;
  energyEmissionsValue: string;
  hasElevator: boolean;
  hasAirConditioning: boolean;
  hasTerrace: boolean;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  hasStorageRoom: boolean;
  isFurnished: boolean;
  isExterior: boolean;
  description: string;
}

export const emptyPropertyForm: PropertyFormValues = {
  reference: "",
  title: "",
  type: "PISO",
  listingType: "VENTA",
  price: "",
  city: "",
  zone: "",
  address: "",
  bedrooms: "",
  bathrooms: "",
  areaM2: "",
  usableAreaM2: "",
  floor: "",
  yearBuilt: "",
  condition: "",
  parkingSpaces: "",
  heating: "",
  hoaFees: "",
  energyRating: "",
  energyConsumptionValue: "",
  energyEmissionsRating: "",
  energyEmissionsValue: "",
  hasElevator: false,
  hasAirConditioning: false,
  hasTerrace: false,
  hasBalcony: false,
  hasGarden: false,
  hasPool: false,
  hasStorageRoom: false,
  isFurnished: false,
  isExterior: false,
  description: "",
};

// Los campos numéricos aceptan formato español ("185.000" o "185,000" como
// miles, "120,5" como decimal): sin esto, un <input type="number"> nativo
// interpreta el punto como separador decimal y rechaza la coma directamente,
// así que "185.000 €" se guardaba como 185 € o fallaba al no ser un entero.
function parseSpanishInt(s: string): number | null {
  const cleaned = s.trim().replace(/[.,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseSpanishFloat(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;

  let cleaned: string;
  if (trimmed.includes(",")) {
    // La coma es inequívocamente el separador decimal; cualquier punto es de miles.
    cleaned = trimmed.replace(/\./g, "").replace(",", ".");
  } else {
    // Sin coma, un único punto seguido de 1-2 dígitos es casi seguro decimal
    // ("120.5"); con 3 dígitos o varios puntos, es separador de miles.
    const dotCount = (trimmed.match(/\./g) || []).length;
    const digitsAfterLastDot = trimmed.length - trimmed.lastIndexOf(".") - 1;
    const isDecimalDot = dotCount === 1 && digitsAfterLastDot > 0 && digitsAfterLastDot <= 2;
    cleaned = isDecimalDot ? trimmed : trimmed.replace(/\./g, "");
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function toPropertyPayload(v: PropertyFormValues): Partial<Property> {
  return {
    reference: v.reference.trim(),
    title: v.title.trim(),
    type: v.type as Property["type"],
    listingType: v.listingType as Property["listingType"],
    price: parseSpanishInt(v.price) ?? 0,
    city: v.city.trim() || null,
    zone: v.zone.trim() || null,
    address: v.address.trim() || null,
    bedrooms: parseSpanishInt(v.bedrooms),
    bathrooms: parseSpanishInt(v.bathrooms),
    areaM2: parseSpanishInt(v.areaM2),
    usableAreaM2: parseSpanishInt(v.usableAreaM2),
    floor: parseSpanishInt(v.floor),
    yearBuilt: parseSpanishInt(v.yearBuilt),
    condition: (v.condition || null) as Property["condition"],
    parkingSpaces: parseSpanishInt(v.parkingSpaces),
    heating: (v.heating || null) as Property["heating"],
    hoaFees: parseSpanishInt(v.hoaFees),
    energyRating: (v.energyRating || null) as Property["energyRating"],
    energyConsumptionValue: parseSpanishFloat(v.energyConsumptionValue),
    energyEmissionsRating: (v.energyEmissionsRating || null) as Property["energyEmissionsRating"],
    energyEmissionsValue: parseSpanishFloat(v.energyEmissionsValue),
    hasElevator: v.hasElevator,
    hasAirConditioning: v.hasAirConditioning,
    hasTerrace: v.hasTerrace,
    hasBalcony: v.hasBalcony,
    hasGarden: v.hasGarden,
    hasPool: v.hasPool,
    hasStorageRoom: v.hasStorageRoom,
    isFurnished: v.isFurnished,
    isExterior: v.isExterior,
    description: v.description.trim() || null,
  };
}

function str(n?: number | null): string {
  return n == null ? "" : String(n);
}

export function fromProperty(p: Property): PropertyFormValues {
  return {
    reference: p.reference,
    title: p.title,
    type: p.type,
    listingType: p.listingType,
    price: str(p.price),
    city: p.city ?? "",
    zone: p.zone ?? "",
    address: p.address ?? "",
    bedrooms: str(p.bedrooms),
    bathrooms: str(p.bathrooms),
    areaM2: str(p.areaM2),
    usableAreaM2: str(p.usableAreaM2),
    floor: str(p.floor),
    yearBuilt: str(p.yearBuilt),
    condition: p.condition ?? "",
    parkingSpaces: str(p.parkingSpaces),
    heating: p.heating ?? "",
    hoaFees: str(p.hoaFees),
    energyRating: p.energyRating ?? "",
    energyConsumptionValue: str(p.energyConsumptionValue),
    energyEmissionsRating: p.energyEmissionsRating ?? "",
    energyEmissionsValue: str(p.energyEmissionsValue),
    hasElevator: Boolean(p.hasElevator),
    hasAirConditioning: Boolean(p.hasAirConditioning),
    hasTerrace: Boolean(p.hasTerrace),
    hasBalcony: Boolean(p.hasBalcony),
    hasGarden: Boolean(p.hasGarden),
    hasPool: Boolean(p.hasPool),
    hasStorageRoom: Boolean(p.hasStorageRoom),
    isFurnished: Boolean(p.isFurnished),
    isExterior: Boolean(p.isExterior),
    description: p.description ?? "",
  };
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-5 pt-5 first:pt-0 last:border-0 last:pb-0">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-slate-400">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

export function PropertyForm({
  value,
  onChange,
  hideDescription,
}: {
  value: PropertyFormValues;
  onChange: (v: PropertyFormValues) => void;
  hideDescription?: boolean;
}) {
  const set = <K extends keyof PropertyFormValues>(key: K, val: PropertyFormValues[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Section title="Datos básicos">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Referencia *</label>
            <input required value={value.reference} onChange={(e) => set("reference", e.target.value)} className={inputClass} />
          </div>
          <div className="col-span-2 sm:col-span-3">
            <label className={labelClass}>Título *</label>
            <input required value={value.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tipo de inmueble</label>
            <select value={value.type} onChange={(e) => set("type", e.target.value)} className={inputClass}>
              {Object.entries(propertyTypeLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Operación</label>
            <select value={value.listingType} onChange={(e) => set("listingType", e.target.value)} className={inputClass}>
              {Object.entries(listingTypeLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select value={value.condition} onChange={(e) => set("condition", e.target.value)} className={inputClass}>
              <option value="">Sin especificar</option>
              {Object.entries(propertyConditionLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Precio (€) *</label>
            <input
              required
              type="text"
              inputMode="numeric"
              placeholder="Ej. 185.000"
              value={value.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      <Section title="Ubicación">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Ciudad</label>
            <input value={value.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Zona / Barrio</label>
            <input value={value.zone} onChange={(e) => set("zone", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input value={value.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Las coordenadas exactas (para el mapa) se añaden después, desde la ficha de la propiedad.
        </p>
      </Section>

      <Section title="Superficie y distribución">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Superficie construida (m²)</label>
            <input type="text" inputMode="numeric" value={value.areaM2} onChange={(e) => set("areaM2", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Superficie útil (m²)</label>
            <input
              type="text"
              inputMode="numeric"
              value={value.usableAreaM2}
              onChange={(e) => set("usableAreaM2", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Habitaciones</label>
            <input type="text" inputMode="numeric" value={value.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Baños</label>
            <input type="text" inputMode="numeric" value={value.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Planta</label>
            <input type="text" inputMode="numeric" value={value.floor} onChange={(e) => set("floor", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Año de construcción</label>
            <input type="text" inputMode="numeric" value={value.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Plazas de garaje</label>
            <input
              type="text"
              inputMode="numeric"
              value={value.parkingSpaces}
              onChange={(e) => set("parkingSpaces", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Gastos de comunidad (€/mes)</label>
            <input type="text" inputMode="numeric" value={value.hoaFees} onChange={(e) => set("hoaFees", e.target.value)} className={inputClass} />
          </div>
        </div>
      </Section>

      <Section title="Características" subtitle="Marca todo lo que aplique — ayuda a filtrar mejor las búsquedas.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(value[a.key])}
                onChange={(e) => set(a.key, e.target.checked as PropertyFormValues[typeof a.key])}
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              {a.label}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label className={labelClass}>Calefacción</label>
          <select value={value.heating} onChange={(e) => set("heating", e.target.value)} className={`${inputClass} max-w-xs`}>
            <option value="">Sin especificar</option>
            {Object.entries(heatingLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section
        title="Certificado energético"
        subtitle="Obligatorio por ley para publicar el inmueble. Necesitas la letra y el valor numérico de consumo y de emisiones."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Consumo (letra)</label>
            <select value={value.energyRating} onChange={(e) => set("energyRating", e.target.value)} className={inputClass}>
              <option value="">Sin especificar</option>
              {Object.entries(energyRatingLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Consumo (kWh/m² año)</label>
            <input
              type="text"
              inputMode="decimal"
              value={value.energyConsumptionValue}
              onChange={(e) => set("energyConsumptionValue", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Emisiones (letra)</label>
            <select
              value={value.energyEmissionsRating}
              onChange={(e) => set("energyEmissionsRating", e.target.value)}
              className={inputClass}
            >
              <option value="">Sin especificar</option>
              {Object.entries(energyRatingLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Emisiones (kg CO₂/m² año)</label>
            <input
              type="text"
              inputMode="decimal"
              value={value.energyEmissionsValue}
              onChange={(e) => set("energyEmissionsValue", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      {!hideDescription && (
        <Section title="Descripción">
          <textarea
            rows={4}
            value={value.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Puedes dejarlo en blanco y generarla luego con el redactor de IA desde la ficha de la propiedad."
            className={inputClass}
          />
        </Section>
      )}
    </div>
  );
}

export function usePropertyForm() {
  return useState<PropertyFormValues>(emptyPropertyForm);
}
