import { getProperties } from "@/lib/api";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFiltersBar } from "@/components/PropertyFiltersBar";
import type { PropertyFilters } from "@/lib/types";

const PAGE_SIZE = 12;

export const metadata = { title: "Propiedades" };

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: PropertyFilters = {
    type: one(params.type),
    listingType: one(params.listingType),
    city: one(params.city),
    bedroomsMin: one(params.bedroomsMin),
    priceMin: one(params.priceMin),
    priceMax: one(params.priceMax),
    q: one(params.q),
    page: one(params.page),
  };

  const data = await getProperties(filters).catch(() => ({ properties: [], total: 0, page: 1, pageSize: PAGE_SIZE }));
  const totalPages = Math.max(1, Math.ceil(data.total / (data.pageSize || PAGE_SIZE)));
  const currentPage = data.page || 1;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-14 pt-28">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Catálogo</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Todas las propiedades</h1>
        <p className="mt-2 text-sm text-ink-soft">{data.total} propiedades encontradas</p>
      </div>

      <div className="mt-8">
        <PropertyFiltersBar filters={filters} />
      </div>

      {data.properties.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {data.properties.map((property, i) => (
            <PropertyCard key={property.id} property={property} index={i} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-ink-soft">
          No hay propiedades que coincidan con esos filtros. Prueba a ajustarlos.
        </p>
      )}

      {totalPages > 1 && (
        <div className="mt-14 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PageLink key={p} page={p} active={p === currentPage} filters={filters} />
          ))}
        </div>
      )}
    </div>
  );
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function PageLink({ page, active, filters }: { page: number; active: boolean; filters: PropertyFilters }) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "page") params.set(key, value);
  });
  params.set("page", String(page));

  return (
    <a
      href={`/propiedades?${params.toString()}`}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
        active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim"
      }`}
    >
      {page}
    </a>
  );
}
