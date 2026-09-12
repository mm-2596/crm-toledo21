import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 pt-16 text-center">
      <p className="font-display text-8xl text-gold">404</p>
      <h1 className="mt-4 font-display text-2xl text-ink sm:text-3xl">Esta página se nos ha perdido</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Puede que el enlace esté roto o que la propiedad ya no esté disponible. Prueba a buscar de nuevo.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-transform hover:scale-[1.02]"
        >
          <Home size={15} />
          Volver al inicio
        </Link>
        <Link
          href="/propiedades"
          className="flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:bg-paper-dim"
        >
          <Search size={15} />
          Ver propiedades
        </Link>
      </div>
    </div>
  );
}
