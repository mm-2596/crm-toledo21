import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DarkPropertyCard } from "./DarkPropertyCard";
import type { PublicProperty } from "@/lib/types";

export function FeaturedPropertiesSection({ sale, rent }: { sale: PublicProperty[]; rent: PublicProperty[] }) {
  return (
    <section className="bg-ink py-20">
      <div className="mx-auto max-w-7xl px-6">
        <PropertyGroup
          title="Propiedades en venta"
          properties={sale}
          emptyText="Todavía no hay propiedades en venta. Vuelve pronto."
          href="/propiedades?listingType=VENTA"
        />

        <div className="mt-20 border-t border-paper/10 pt-20">
          <PropertyGroup
            title="Propiedades en alquiler"
            properties={rent}
            emptyText="Todavía no hay propiedades en alquiler. Vuelve pronto."
            href="/propiedades?listingType=ALQUILER"
          />
        </div>
      </div>
    </section>
  );
}

function PropertyGroup({
  title,
  properties,
  emptyText,
  href,
}: {
  title: string;
  properties: PublicProperty[];
  emptyText: string;
  href: string;
}) {
  return (
    <div>
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <h2 className="font-display text-3xl text-paper sm:text-4xl">{title}</h2>
        <Link
          href={href}
          className="group hidden items-center gap-2 text-sm text-paper/70 transition-colors hover:text-paper sm:flex"
        >
          Ver todas
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {properties.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property, i) => (
            <DarkPropertyCard key={property.id} property={property} index={i} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-paper/50 sm:text-left">{emptyText}</p>
      )}

      <div className="mt-8 text-center sm:hidden">
        <Link
          href={href}
          className="group inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-sm text-paper transition-colors hover:bg-paper hover:text-ink"
        >
          Ver todas
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
