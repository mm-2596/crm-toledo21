import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { BLOG_POSTS, getBlogPost, getSortedPosts } from "@/lib/blog";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getSortedPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-6 pb-20 pt-28">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={14} /> Actualidad
      </Link>

      <p className="mt-6 text-xs font-medium uppercase tracking-wider text-gold">{post.category}</p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">{post.title}</h1>
      <div className="mt-4 flex items-center gap-3 text-xs text-ink-soft">
        <span>{formatDate(post.date)}</span>
        <span className="flex items-center gap-1">
          <Clock size={12} /> {post.readMinutes} min de lectura
        </span>
      </div>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-line">
        <Image src={post.image} alt={post.imageAlt} fill sizes="768px" className="object-cover" priority />
      </div>

      <div className="mt-10 flex flex-col gap-5">
        {post.content.map((block, i) => {
          if (block.type === "h2") {
            return (
              <h2 key={i} className="mt-4 font-display text-xl text-ink sm:text-2xl">
                {block.text}
              </h2>
            );
          }
          if (block.type === "ul") {
            return (
              <ul key={i} className="flex flex-col gap-2 pl-1">
                {block.items?.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft sm:text-base">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="text-sm leading-relaxed text-ink-soft sm:text-base">
              {block.text}
            </p>
          );
        })}
      </div>

      <div className="mt-12 rounded-2xl bg-ink px-6 py-8 text-center sm:px-10">
        <h3 className="font-display text-xl text-paper sm:text-2xl">¿Tienes dudas sobre tu caso?</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-paper/70">
          Cuéntanos qué necesitas y un agente de Toledo21 te responde en menos de 24 horas.
        </p>
        <Link
          href="/#contacto"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.03]"
        >
          Hablar con un agente
          <ArrowRight size={15} />
        </Link>
      </div>

      {related.length > 0 && (
        <div className="mt-14 border-t border-line pt-10">
          <h3 className="font-display text-lg text-ink">Sigue leyendo</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group overflow-hidden rounded-xl border border-line hover:border-gold/50"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={r.image}
                    alt={r.imageAlt}
                    fill
                    sizes="240px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <p className="p-3 text-sm font-medium leading-snug text-ink">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
