import { getProperties } from "@/lib/api";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFiltersBar } from "@/components/PropertyFiltersBar";
import type { PropertyFilters } from "@/lib/types";

const PAGE_SIZE = 12;

export type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function filtersFromParams(params: SearchParams, fixedListingType?: "VENTA" | "ALQUILER"): PropertyFilters {
  return {
    type: one(params.type),
    listingType: fixedListingType ?? one(params.listingType),
    city: one(params.city),
    bedroomsMin: one(params.bedroomsMin),
    bathroomsMin: one(params.bathroomsMin),
    priceMin: one(params.priceMin),
    priceMax: one(params.priceMax),
    areaMin: one(params.areaMin),
    areaMax: one(params.areaMax),
    elevator: one(params.elevator),
    pool: one(params.pool),
    terrace: one(params.terrace),
    garden: one(params.garden),
    parking: one(params.parking),
    storage: one(params.storage),
    sort: one(params.sort),
    q: one(params.q),
    page: one(params.page),
  };
}

export async function PropertyListing({
  filters,
  basePath,
  title,
  intro,
  fixedListingType,
  emptyHint,
}: {
  filters: PropertyFilters;
  basePath: string;
  title: string;
  intro?: string;
  fixedListingType?: "VENTA" | "ALQUILER";
  emptyHint?: string;
}) {
  const data = await getProperties(filters).catch(() => ({ properties: [], total: 0, page: 1, pageSize: PAGE_SIZE }));
  const totalPages = Math.max(1, Math.ceil(data.total / (data.pageSize || PAGE_SIZE)));
  const currentPage = data.page || 1;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-14 pt-28">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-sm text-ink-soft">{intro}</p>}
        <p className="mt-2 text-sm text-ink-soft">
          {data.total} {data.total === 1 ? "propiedad encontrada" : "propiedades encontradas"}
        </p>
      </div>

      <div className="mt-8">
        <PropertyFiltersBar filters={filters} basePath={basePath} fixedListingType={fixedListingType} />
      </div>

      {data.properties.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {data.properties.map((property, i) => (
            <PropertyCard key={property.id} property={property} index={i} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-ink-soft">
          {emptyHint ?? "No hay propiedades que coincidan con esos filtros. Prueba a ajustarlos."}
        </p>
      )}

      {totalPages > 1 && (
        <div className="mt-14 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PageLink key={p} page={p} active={p === currentPage} filters={filters} basePath={basePath} fixed={Boolean(fixedListingType)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PageLink({
  page,
  active,
  filters,
  basePath,
  fixed,
}: {
  page: number;
  active: boolean;
  filters: PropertyFilters;
  basePath: string;
  fixed: boolean;
}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "page" && !(fixed && key === "listingType")) params.set(key, value);
  });
  params.set("page", String(page));

  return (
    <a
      href={`${basePath}?${params.toString()}`}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
        active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim"
      }`}
    >
      {page}
    </a>
  );
}
