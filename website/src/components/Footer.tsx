import Link from "next/link";
import Image from "next/image";

const EXPLORE_LINKS = [
  { href: "/propiedades", label: "Propiedades" },
  { href: "/comparar", label: "Comparar" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/calculadora", label: "Calculadora de hipoteca" },
];

const COMPANY_LINKS = [
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/equipo", label: "Equipo" },
  { href: "/gestoria", label: "Servicios de gestoría" },
  { href: "/oficinas", label: "Nuestras oficinas" },
  { href: "/agentes", label: "Zona de agentes" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-dim">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="/logo/toledo21-logo.png"
              alt="Toledo21 — somos tu inmobiliaria.es"
              width={1237}
              height={435}
              className="h-14 w-auto object-contain object-left"
            />
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Inmuebles seleccionados en Getafe y Madrid sur, con datos completos y un equipo de agentes dedicado a
              acompañarte en cada paso.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-soft">Propiedades</div>
            <ul className="flex flex-col gap-2 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-ink-soft hover:text-ink">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-soft">Empresa</div>
            <ul className="flex flex-col gap-2 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-ink-soft hover:text-ink">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-soft">Contacto</div>
            <p className="text-sm text-ink-soft">C. Toledo, 21, 28901 Getafe, Madrid</p>
            <p className="mt-1 text-sm text-ink-soft">673 49 00 94</p>
            <p className="mt-1 text-sm text-ink-soft">info@somostuinmobiliaria.es</p>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Toledo21. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/aviso-legal" className="hover:text-ink">Aviso legal</Link>
            <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
            <Link href="/cookies" className="hover:text-ink">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
