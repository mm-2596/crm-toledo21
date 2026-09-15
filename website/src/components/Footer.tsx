import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-dim">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
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
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-soft">Explorar</div>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/propiedades" className="text-ink-soft hover:text-ink">Propiedades</Link></li>
              <li><Link href="/equipo" className="text-ink-soft hover:text-ink">Equipo</Link></li>
              <li><Link href="/comparar" className="text-ink-soft hover:text-ink">Comparar</Link></li>
              <li><Link href="/favoritos" className="text-ink-soft hover:text-ink">Favoritos</Link></li>
              <li><Link href="/calculadora" className="text-ink-soft hover:text-ink">Calculadora de hipoteca</Link></li>
              <li><Link href="/gestoria" className="text-ink-soft hover:text-ink">Servicios de gestoría</Link></li>
              <li><Link href="/oficinas" className="text-ink-soft hover:text-ink">Nuestras oficinas</Link></li>
              <li><Link href="/agentes" className="text-ink-soft hover:text-ink">Zona de agentes</Link></li>
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
