"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Menu, Scale, Search, X } from "lucide-react";
import { useCompare } from "./CompareContext";
import { useFavorites } from "./FavoritesContext";

// Los enlaces siempre visibles son los que un visitante busca primero;
// el resto (trámites, herramientas) se agrupan bajo "Servicios" para no
// saturar la barra con seis enlaces sueltos al mismo nivel.
const primaryLinks = [
  { href: "/propiedades", label: "Propiedades" },
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/equipo", label: "Equipo" },
];

const serviceLinks = [
  { href: "/gestoria", label: "Servicios de gestoría" },
  { href: "/calculadora", label: "Calculadora de hipoteca" },
  { href: "/oficinas", label: "Nuestras oficinas" },
];

// Comparar y Favoritos ya tienen su propio icono con contador en el navbar
// de escritorio; en el menú móvil, sin esos iconos, se listan aquí también.
const mobileOnlyLinks = [
  { href: "/comparar", label: "Comparar" },
  { href: "/favoritos", label: "Favoritos" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";
  // Lazy initial value avoids a synchronous setState-on-mount: on the common
  // case (landing directly on "/"), the hero is visible from the first paint.
  const [heroVisible, setHeroVisible] = useState(isHome);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [servicesOpen, setServicesOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const { ids } = useCompare();
  const { ids: favoriteIds } = useFavorites();

  const onDark = isHome && heroVisible;

  useEffect(() => {
    if (!isHome) return;
    const el = document.getElementById("hero");
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
      rootMargin: "-72px 0px 0px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isHome, pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searching && searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearching(false);
      }
      if (servicesOpen && servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [searching, servicesOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/propiedades${params.toString() ? `?${params.toString()}` : ""}`);
    setSearching(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          layout
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          className={`flex items-center justify-between gap-2 rounded-full border px-3 backdrop-blur-xl transition-colors duration-300 sm:px-4 ${
            onDark
              ? "border-paper/15 bg-paper/[0.06] shadow-lg shadow-black/20"
              : "border-line/60 bg-paper/85 shadow-lg shadow-black/[0.06]"
          }`}
          style={{ paddingTop: onDark ? 12 : 8, paddingBottom: onDark ? 12 : 8 }}
        >
          <Link href="/" className="relative h-7 w-[102px] shrink-0 sm:h-8 sm:w-[117px]" aria-label="Toledo21">
            <Image
              src="/logo/toledo21-wordmark.png"
              alt="Toledo21"
              fill
              sizes="120px"
              className="rounded-[3px] object-contain object-left"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm transition-colors ${
                  onDark ? "text-paper/75 hover:text-paper" : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div ref={servicesRef} className="relative">
              <button
                type="button"
                onClick={() => setServicesOpen((v) => !v)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  onDark ? "text-paper/75 hover:text-paper" : "text-ink-soft hover:text-ink"
                }`}
              >
                Servicios
                <ChevronDown size={14} className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                    style={{ transformOrigin: "top left" }}
                    className="absolute left-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-line/60 bg-paper py-2 shadow-lg shadow-black/[0.08]"
                  >
                    {serviceLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setServicesOpen(false)}
                        className="block px-4 py-2 text-sm text-ink-soft hover:bg-paper-dim hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div ref={searchRef} className="hidden items-center md:flex">
              <AnimatePresence initial={false} mode="popLayout">
                {searching ? (
                  <motion.form
                    key="input"
                    onSubmit={submitSearch}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por zona…"
                      className={`w-[200px] rounded-full px-4 py-1.5 text-sm focus:outline-none ${
                        onDark
                          ? "bg-paper/10 text-paper placeholder:text-paper/40"
                          : "bg-paper-dim text-ink placeholder:text-ink-soft/60"
                      }`}
                    />
                  </motion.form>
                ) : (
                  <motion.button
                    key="icon"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSearching(true)}
                    aria-label="Buscar propiedades"
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      onDark ? "text-paper/75 hover:bg-paper/10 hover:text-paper" : "text-ink-soft hover:bg-paper-dim hover:text-ink"
                    }`}
                  >
                    <Search size={17} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/favoritos"
              className={`relative hidden h-8 w-8 items-center justify-center rounded-full md:flex ${
                onDark ? "text-paper/75 hover:bg-paper/10 hover:text-paper" : "text-ink-soft hover:bg-paper-dim hover:text-ink"
              }`}
              aria-label="Ver favoritos"
            >
              <Heart size={17} />
              {favoriteIds.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[9px] font-medium text-ink">
                  {favoriteIds.length}
                </span>
              )}
            </Link>

            <Link
              href="/comparar"
              className={`relative hidden h-8 w-8 items-center justify-center rounded-full md:flex ${
                onDark ? "text-paper/75 hover:bg-paper/10 hover:text-paper" : "text-ink-soft hover:bg-paper-dim hover:text-ink"
              }`}
              aria-label="Comparar propiedades"
            >
              <Scale size={17} />
              {ids.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[9px] font-medium text-ink">
                  {ids.length}
                </span>
              )}
            </Link>

            <Link
              href="/agentes"
              className={`hidden rounded-full px-4 py-1.5 text-sm transition-transform hover:scale-[1.03] md:block ${
                onDark ? "bg-gold text-ink" : "bg-ink text-paper"
              }`}
            >
              Zona de agentes
            </Link>

            <button
              className={onDark ? "text-paper md:hidden" : "text-ink md:hidden"}
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="mt-2 overflow-hidden rounded-3xl border border-line/60 bg-paper/95 shadow-lg shadow-black/[0.06] backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-1 px-6 py-4">
                {[...primaryLinks, ...mobileOnlyLinks].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="py-2 text-sm text-ink-soft"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-2 border-t border-line pt-2 text-xs font-medium uppercase tracking-wider text-ink-soft/70">
                  Servicios
                </div>
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="py-2 text-sm text-ink-soft"
                  >
                    {link.label}
                  </Link>
                ))}

                <Link
                  href="/agentes"
                  onClick={() => setOpen(false)}
                  className="mt-2 border-t border-line pt-3 text-sm font-medium text-ink"
                >
                  Zona de agentes
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
