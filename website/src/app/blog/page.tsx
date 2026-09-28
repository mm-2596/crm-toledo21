import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { getSortedPosts } from "@/lib/blog";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Actualidad",
  description:
    "Guías y consejos de Toledo21 sobre comprar, vender y alquilar vivienda en Getafe y Madrid sur: gastos, hipotecas, trámites y más.",
};

export default function BlogPage() {
  const posts = getSortedPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Actualidad</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Guías para comprar, vender y alquilar</h1>
        <p className="mt-3 text-sm text-ink-soft sm:text-base">
          Consejos prácticos de nuestro equipo, pensados para quien compra, vende o alquila en Getafe y Madrid sur.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Link
          href={`/blog/${featured.slug}`}
          className="group relative row-span-2 overflow-hidden rounded-3xl border border-line lg:min-h-[520px]"
        >
          <Image
            src={featured.image}
            alt={featured.imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink">{featured.category}</span>
            <h2 className="mt-4 font-display text-2xl leading-snug text-paper sm:text-3xl">{featured.title}</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/75">{featured.excerpt}</p>
            <div className="mt-4 flex items-center gap-3 text-xs text-paper/60">
              <span>{formatDate(featured.date)}</span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {featured.readMinutes} min de lectura
              </span>
            </div>
          </div>
        </Link>

        {rest.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex gap-4 overflow-hidden rounded-2xl border border-line bg-paper p-3 transition-colors hover:border-gold/50 sm:p-4"
          >
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-32">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                sizes="140px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gold">{post.category}</span>
              <h3 className="mt-1 font-display text-base leading-snug text-ink sm:text-lg">{post.title}</h3>
              <div className="mt-2 flex items-center gap-1 text-xs text-ink-soft">
                <span>{formatDate(post.date)}</span>
                <ArrowRight size={12} className="ml-auto shrink-0 text-ink-soft/50 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
