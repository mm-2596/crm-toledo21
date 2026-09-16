import type { Metadata } from "next";
import Link from "next/link";
import { HandHeart, MapPinned, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Desde 1997, Toledo21 - Somos Tu Inmobiliaria acompaña a familias y empresas en Getafe y Madrid sur a comprar, vender y alquilar con tranquilidad.",
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Seguridad y confianza",
    description:
      "Más de 25 años de trayectoria nos sitúan como una de las agencias más serias y cualificadas del sector.",
  },
  {
    icon: HandHeart,
    title: "Trato personalizado",
    description:
      "Cada persona que llega buscando un hogar, o queriendo vender el suyo, recibe acompañamiento real de un agente, no un trámite genérico.",
  },
  {
    icon: Sparkles,
    title: "Claridad y transparencia",
    description:
      "Preferimos decir lo que necesitas saber antes que lo que quieres oír: valoraciones honestas y sin letra pequeña.",
  },
  {
    icon: MapPinned,
    title: "Cercanía real",
    description: "Oficinas en Getafe y Leganés, con equipo propio de gestoría para resolver todo el proceso sin salir de casa.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-28">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">La cara amable de tu inmobiliaria</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
          Desde 1997 acompañamos a quienes compran, venden o alquilan una vivienda en Getafe y Madrid sur. No
          prometemos lo que no cumplimos: nuestro trabajo es que todo el proceso — desde la primera visita hasta
          la entrega de llaves — sea sencillo, claro y sin sorpresas.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl text-ink">Especialistas inmobiliarios</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Nuestro asesoramiento integral y la cercanía a los clientes son nuestras señas de identidad. Cuando
            decides vender con nosotros, desarrollamos un plan de difusión pensado para tu propiedad concreta —
            no una ficha más entre miles — y te acompañamos con valoraciones reales, comparadas con el mercado y
            con ventas de inmuebles similares en la zona.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Al comprar, cada propiedad de nuestra cartera tiene un agente real detrás, disponible para resolver
            dudas y acompañarte en cada visita.
          </p>
        </div>
        <div className="rounded-3xl bg-paper-dim p-8">
          <p className="font-display text-xl leading-snug text-ink">
            &ldquo;Lo que realmente nos importa es vivir tranquilos haciendo lo que nos gusta — y eso se traduce en
            la tranquilidad de quienes confían en nosotros.&rdquo;
          </p>
          <p className="mt-4 text-sm text-ink-soft">Equipo de Toledo21</p>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-display text-2xl text-ink">Nuestros valores</h2>
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
          {VALUES.map((value) => (
            <div key={value.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
                <value.icon size={19} />
              </span>
              <div>
                <h3 className="font-display text-lg text-ink">{value.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl bg-ink px-8 py-12 text-center sm:px-12">
        <h2 className="max-w-xl font-display text-2xl text-paper sm:text-3xl">¿Hablamos de tu próximo paso?</h2>
        <p className="max-w-lg text-sm text-paper/70">
          Ven a conocernos en persona o consulta a nuestro equipo, sin compromiso.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/oficinas"
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.03]"
          >
            Ver nuestras oficinas
          </Link>
          <Link
            href="/equipo"
            className="rounded-full border border-paper/20 px-6 py-3 text-sm text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Conoce al equipo
          </Link>
        </div>
      </div>
    </div>
  );
}
