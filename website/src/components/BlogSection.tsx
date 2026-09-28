import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSortedPosts } from "@/lib/blog";
import { formatDate } from "@/lib/format";

export function BlogSection() {
  const [featured, ...rest] = getSortedPosts().slice(0, 4);

  return (
    <section className="bg-ink py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gold">Actualidad</p>
            <h2 className="mt-1 font-display text-3xl text-paper sm:text-4xl">Guías para comprar, vender y alquilar</h2>
          </div>
          <Link
            href="/blog"
            className="group hidden shrink-0 items-center gap-2 rounded-full border border-paper/20 px-5 py-2.5 text-sm text-paper transition-colors hover:bg-paper hover:text-ink sm:flex"
          >
            Ver todas
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Link href={`/blog/${featured.slug}`} className="group relative overflow-hidden rounded-2xl lg:row-span-2">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[420px]">
              <Image
                src={featured.image}
                alt={featured.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <span className="rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink">{featured.category}</span>
              <h3 className="mt-3 font-display text-xl leading-snug text-paper sm:text-2xl">{featured.title}</h3>
              <p className="mt-1 text-xs text-paper/60">{formatDate(featured.date)}</p>
            </div>
          </Link>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-1">
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-2xl sm:flex-row lg:items-center lg:gap-4">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl sm:w-32 sm:shrink-0 lg:w-28">
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    fill
                    sizes="140px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0 pt-3 sm:pt-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gold">{post.category}</p>
                  <h4 className="mt-1 font-display text-base leading-snug text-paper">{post.title}</h4>
                  <p className="mt-1 text-xs text-paper/50">{formatDate(post.date)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-sm text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Ver todas
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
