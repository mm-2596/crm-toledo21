import Link from "next/link";
import { KeyRound } from "lucide-react";
import { getProperties } from "@/lib/api";
import { Hero } from "@/components/Hero";
import { InfiniteMarquee } from "@/components/InfiniteMarquee";
import { ProcessShowcase } from "@/components/ProcessShowcase";
import { FeaturedPropertiesSection } from "@/components/FeaturedPropertiesSection";

export default async function Home() {
  const [featured, forRent] = await Promise.all([
    getProperties({ listingType: "VENTA" }).catch(() => ({ properties: [], total: 0, page: 1, pageSize: 0 })),
    getProperties({ listingType: "ALQUILER" }).catch(() => ({ properties: [], total: 0, page: 1, pageSize: 0 })),
  ]);

  const destacados = featured.properties.slice(0, 3);
  const alquiler = forRent.properties.slice(0, 3);
  const heroProperties = [...featured.properties, ...forRent.properties]
    .filter((p) => p.images.length > 0)
    .slice(0, 5);

  return (
    <div>
      <Hero properties={heroProperties} />

      <InfiniteMarquee />

      <FeaturedPropertiesSection sale={destacados} rent={alquiler} />

      <section className="mx-auto max-w-7xl px-6 pt-20">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gold">¿Qué ofrecemos?</p>
          <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl text-ink sm:text-4xl">
            Comprar o vender puede ser abrumador — lo hacemos sencillo.
          </h2>
        </div>
      </section>
      <ProcessShowcase />

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-ink px-8 py-14 text-center sm:px-16">
          <KeyRound size={26} className="text-gold" />
          <h2 className="font-display text-3xl text-paper sm:text-4xl">¿Eres agente de Toledo21?</h2>
          <p className="max-w-md text-sm text-paper/70">
            Accede a tu panel para consultar tus propiedades activas y el estado de tus leads, conectado directamente
            con el CRM.
          </p>
          <Link
            href="/agentes"
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            Entrar a la zona de agentes
          </Link>
        </div>
      </section>
    </div>
  );
}
