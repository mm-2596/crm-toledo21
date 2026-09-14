import { getProperties } from "@/lib/api";
import { Hero } from "@/components/Hero";
import { InfiniteMarquee } from "@/components/InfiniteMarquee";
import { ProcessShowcase } from "@/components/ProcessShowcase";
import { FeaturedPropertiesSection } from "@/components/FeaturedPropertiesSection";
import { HomeContactForm } from "@/components/HomeContactForm";

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

      <HomeContactForm />
    </div>
  );
}
