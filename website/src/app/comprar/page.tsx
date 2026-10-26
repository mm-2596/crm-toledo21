import { PropertyListing, filtersFromParams, type SearchParams } from "@/components/PropertyListing";

export const metadata = {
  title: "Comprar vivienda en Getafe y Madrid sur",
  description: "Pisos, casas y chalets en venta en Getafe y Madrid sur. Filtra por zona, precio, habitaciones y extras.",
};

export default async function ComprarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = filtersFromParams(await searchParams, "VENTA");
  return (
    <PropertyListing
      filters={filters}
      basePath="/comprar"
      fixedListingType="VENTA"
      title="Viviendas en venta"
      intro="Pisos, casas y chalets en Getafe y Madrid sur. Te acompañamos desde la primera visita hasta la firma."
      emptyHint="No hay viviendas en venta con esos filtros. Prueba a ajustarlos o cuéntanos qué buscas y te avisamos."
    />
  );
}
