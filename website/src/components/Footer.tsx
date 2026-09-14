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
              Inmuebles seleccionados en Toledo, con datos completos y un equipo de agentes dedicado a
              acompañarte en cada paso.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-soft">Explorar</div>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/propiedades" className="text-ink-soft hover:text-ink">Propiedades</Link></li>
              <li><Link href="/comparar" className="text-ink-soft hover:text-ink">Comparar</Link></li>
              <li><Link href="/calculadora" className="text-ink-soft hover:text-ink">Calculadora de hipoteca</Link></li>
              <li><Link href="/agentes" className="text-ink-soft hover:text-ink">Zona de agentes</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-soft">Contacto</div>
            <p className="text-sm text-ink-soft">Toledo, España</p>
            <p className="mt-1 text-sm text-ink-soft">hola@toledo21.com</p>
          </div>
        </div>
        <div className="mt-12 border-t border-line pt-6 text-xs text-ink-soft">
          © {new Date().getFullYear()} Toledo21. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
