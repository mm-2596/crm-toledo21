import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BedDouble,
  Bath,
  Maximize,
  Layers,
  Car,
  Calendar,
  Flame,
  Wind,
  Trees,
  Waves,
  Sofa,
  Warehouse,
  Sun,
  Mail,
  Phone,
} from "lucide-react";
import { getProperty } from "@/lib/api";
import { PropertyGallery } from "@/components/PropertyGallery";
import { ContactForm } from "@/components/ContactForm";
import { MortgageCalculator } from "@/components/MortgageCalculator";
import { PropertyCard } from "@/components/PropertyCard";
import {
  conditionLabels,
  formatCurrency,
  heatingLabels,
  listingTypeLabels,
  propertyTypeLabels,
} from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id).catch(() => null);
  if (!property) return { title: "Propiedad no encontrada" };

  const location = [property.zone, property.city].filter(Boolean).join(", ") || "Toledo";
  const details = [
    formatCurrency(property.price),
    property.areaM2 != null ? `${property.areaM2} m²` : null,
    property.bedrooms != null ? `${property.bedrooms} hab` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const description = `${propertyTypeLabels[property.type]} en ${listingTypeLabels[property.listingType].toLowerCase()} en ${location}. ${details}.`;
  const image = property.images[0]?.url;

  return {
    title: property.title,
    description,
    openGraph: {
      title: property.title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id).catch(() => null);
  if (!property) notFound();

  const amenities = [
    property.hasElevator && { icon: <Layers size={16} />, label: "Ascensor" },
    property.parkingSpaces ? { icon: <Car size={16} />, label: `${property.parkingSpaces} plaza(s) de garaje` } : null,
    property.hasAirConditioning && { icon: <Wind size={16} />, label: "Aire acondicionado" },
    property.hasTerrace && { icon: <Sun size={16} />, label: "Terraza" },
    property.hasBalcony && { icon: <Sun size={16} />, label: "Balcón" },
    property.hasGarden && { icon: <Trees size={16} />, label: "Jardín" },
    property.hasPool && { icon: <Waves size={16} />, label: "Piscina" },
    property.hasStorageRoom && { icon: <Warehouse size={16} />, label: "Trastero" },
    property.isFurnished && { icon: <Sofa size={16} />, label: "Amueblado" },
    property.isExterior && { icon: <Sun size={16} />, label: "Exterior" },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  return (
    <div className="mx-auto max-w-7xl px-6 pb-12 pt-28">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">
            {listingTypeLabels[property.listingType]} · {propertyTypeLabels[property.type]}
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{property.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {[property.address, property.zone, property.city].filter(Boolean).join(", ") || "Toledo"} · Ref.{" "}
            {property.reference}
          </p>
        </div>
        <p className="font-display text-3xl text-ink sm:text-4xl">{formatCurrency(property.price)}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyGallery images={property.images} title={property.title} />

          <div className="mt-8 flex flex-wrap gap-6 border-y border-line py-6 text-sm text-ink-soft">
            {property.bedrooms != null && (
              <Spec icon={<BedDouble size={18} />} label={`${property.bedrooms} habitaciones`} />
            )}
            {property.bathrooms != null && <Spec icon={<Bath size={18} />} label={`${property.bathrooms} baños`} />}
            {property.areaM2 != null && <Spec icon={<Maximize size={18} />} label={`${property.areaM2} m² construidos`} />}
            {property.usableAreaM2 != null && (
              <Spec icon={<Maximize size={18} />} label={`${property.usableAreaM2} m² útiles`} />
            )}
            {property.yearBuilt != null && <Spec icon={<Calendar size={18} />} label={`Construido en ${property.yearBuilt}`} />}
            {property.heating && <Spec icon={<Flame size={18} />} label={heatingLabels[property.heating]} />}
          </div>

          {property.description && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">Descripción</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{property.description}</p>
            </div>
          )}

          {amenities.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">Características</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-paper-dim px-3 py-2 text-sm text-ink">
                    <span className="text-gold">{a.icon}</span>
                    {a.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(property.energyRating || property.condition || property.hoaFees != null) && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">Datos adicionales</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                {property.condition && (
                  <InfoRow label="Estado" value={conditionLabels[property.condition]} />
                )}
                {property.hoaFees != null && <InfoRow label="Gastos de comunidad" value={`${formatCurrency(property.hoaFees)}/mes`} />}
                {property.energyRating && (
                  <InfoRow
                    label="Consumo energético"
                    value={`${property.energyRating}${property.energyConsumptionValue ? ` (${property.energyConsumptionValue} kWh/m² año)` : ""}`}
                  />
                )}
                {property.energyEmissionsRating && (
                  <InfoRow
                    label="Emisiones"
                    value={`${property.energyEmissionsRating}${property.energyEmissionsValue ? ` (${property.energyEmissionsValue} kg CO₂/m² año)` : ""}`}
                  />
                )}
              </div>
            </div>
          )}

          {property.listingType === "VENTA" && (
            <div className="mt-10">
              <h2 className="font-display text-xl text-ink">Calcula tu hipoteca</h2>
              <div className="mt-4">
                <MortgageCalculator initialPrice={property.price} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {property.agent && (
            <div className="rounded-2xl border border-line bg-paper-dim p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">Tu agente</p>
              <p className="mt-2 font-display text-lg text-ink">{property.agent.name}</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
                <a href={`mailto:${property.agent.email}`} className="flex items-center gap-2 hover:text-ink">
                  <Mail size={14} /> {property.agent.email}
                </a>
                {property.agent.phone && (
                  <a href={`tel:${property.agent.phone}`} className="flex items-center gap-2 hover:text-ink">
                    <Phone size={14} /> {property.agent.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          <ContactForm propertyId={property.id} propertyTitle={property.title} />
        </div>
      </div>

      {property.similar.length > 0 && (
        <div className="mt-16 border-t border-line pt-12">
          <h2 className="font-display text-2xl text-ink">Propiedades similares</h2>
          <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {property.similar.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-gold">{icon}</span>
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
