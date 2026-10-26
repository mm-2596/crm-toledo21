import { redirect } from "next/navigation";
import { PropertyListing, filtersFromParams, type SearchParams } from "@/components/PropertyListing";

export const metadata = { title: "Propiedades" };

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  // Los enlaces antiguos con operación van a su página (/comprar o /alquilar)
  // conservando el resto de filtros.
  const op = Array.isArray(params.listingType) ? params.listingType[0] : params.listingType;
  if (op === "VENTA" || op === "ALQUILER") {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      const v = Array.isArray(value) ? value[0] : value;
      if (v && key !== "listingType") qs.set(key, v);
    });
    redirect(`${op === "VENTA" ? "/comprar" : "/alquilar"}${qs.toString() ? `?${qs.toString()}` : ""}`);
  }

  return (
    <PropertyListing
      filters={filtersFromParams(params)}
      basePath="/propiedades"
      title="Todas las propiedades"
      intro="Venta y alquiler en un solo listado. También puedes ver solo las viviendas en venta o solo las de alquiler."
    />
  );
}
