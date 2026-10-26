import { PropertyListing, filtersFromParams, type SearchParams } from "@/components/PropertyListing";

export const metadata = {
  title: "Alquilar vivienda en Getafe y Madrid sur",
  description: "Pisos y viviendas en alquiler en Getafe y Madrid sur. Filtra por zona, precio, habitaciones y extras.",
};

export default async function AlquilarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = filtersFromParams(await searchParams, "ALQUILER");
  return (
    <PropertyListing
      filters={filters}
      basePath="/alquilar"
      fixedListingType="ALQUILER"
      title="Viviendas en alquiler"
      intro="Viviendas para alquilar en Getafe y Madrid sur, con acompañamiento en las visitas y en los trámites."
      emptyHint="No hay viviendas en alquiler con esos filtros. Prueba a ajustarlos o cuéntanos qué buscas y te avisamos."
    />
  );
}
