import type { Metadata } from "next";
import { MapPin, Navigation, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Nuestras oficinas",
  description:
    "Toledo21 - Somos Tu Inmobiliaria, con oficinas en Getafe, Leganés y Puerto de Sagunto (Valencia). Ven a visitarnos.",
};

interface Office {
  name: string;
  city: string;
  address: string;
  services: string;
  mapsUrl: string;
  phone?: string;
  featured?: boolean;
}

const OFFICES: Office[] = [
  {
    name: "Toledo21 · Oficina principal",
    city: "Getafe",
    address: "C. Toledo, 21, 28901 Getafe, Madrid",
    services: "Inmobiliaria",
    phone: "916 95 84 22",
    mapsUrl:
      "https://www.google.com/maps/place/Toledo21+-+SomosTuInmobiliaria+-+Getafe,+C.+Toledo,+21,+28901+Getafe,+Madrid/@40.3034017,-3.7327946,15z",
    featured: true,
  },
  {
    name: "Gestoría Sampablo · Somos Tu Gestoría",
    city: "Getafe",
    address: "C. Toledo, 38, 28901 Getafe, Madrid",
    services: "Gestoría",
    mapsUrl:
      "https://www.google.com/maps/place/Gestoría+Sampablo+-+Somos+Tu+Gestoría+-+Getafe,+C.+Toledo,+38,+28901+Getafe,+Madrid/@40.3014095,-3.7339528,15z",
  },
  {
    name: "Toledo21 · Somos Tu Inmobiliaria",
    city: "Leganés",
    address: "Av. Rey Juan Carlos I, 26, 28915 Leganés, Madrid",
    services: "Inmobiliaria y gestoría",
    phone: "910 08 21 21",
    mapsUrl:
      "https://www.google.com/maps/place/Toledo21+-+SomosTuInmobiliaria+-+Leganés,+Av.+Rey+Juan+Carlos+I,+26,+28915+Leganés,+Madrid/@40.33408,-3.75375,15z",
  },
  {
    name: "Toledo21 · Somos Tu Inmobiliaria",
    city: "Puerto de Sagunto, Valencia",
    address: "Av. Hispanitat, 5, 46520 Puerto de Sagunto, Valencia",
    services: "Inmobiliaria",
    mapsUrl:
      "https://www.google.com/maps/place/Toledo21+-+SomosTuInmobiliaria+-+Puerto+de+Sagunto,+Av.+Hispanitat,+5,+46520+Puerto+de+Sagunto,+Valencia/@39.6663699,-0.2328303,15z",
  },
];

function OfficeCard({ office }: { office: Office }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-gold">{office.services}</p>
      <h3 className="mt-1.5 font-display text-lg text-ink">{office.name}</h3>
      <p className="text-sm text-ink-soft">{office.city}</p>
      <p className="mt-3 flex items-start gap-2 text-sm text-ink">
        <MapPin size={15} className="mt-0.5 shrink-0 text-gold" /> {office.address}
      </p>
      {office.phone && <p className="mt-1 text-sm text-ink-soft">{office.phone}</p>}
      <a
        href={office.mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:underline"
      >
        <Navigation size={13} /> Cómo llegar
      </a>
    </div>
  );
}

export default function OfficesPage() {
  const featured = OFFICES.find((o) => o.featured)!;
  const realEstate = OFFICES.filter((o) => !o.featured && o.services.startsWith("Inmobiliaria"));
  const gestorias = OFFICES.filter((o) => o.services === "Gestoría");

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-28">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Nuestras oficinas</h1>
        <p className="mt-3 text-sm text-ink-soft sm:text-base">
          Desde 1997 acompañando a nuestros clientes. Hoy tenemos presencia en Madrid sur y en Valencia — ven a
          visitarnos o contáctanos desde la oficina que te quede más cerca.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-gold/30 bg-gold-soft p-8">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gold">
          <Star size={13} className="fill-gold" /> Oficina principal
        </span>
        <h2 className="mt-2 font-display text-2xl text-ink">{featured.name}</h2>
        <p className="mt-1 text-sm text-ink-soft">{featured.city} · {featured.services}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink">
          <span className="flex items-center gap-2">
            <MapPin size={15} className="text-gold" /> {featured.address}
          </span>
          {featured.phone && <span>{featured.phone}</span>}
        </div>
        <a
          href={featured.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-transform hover:scale-[1.03]"
        >
          <Navigation size={14} /> Cómo llegar
        </a>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl text-ink">Inmobiliarias</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {realEstate.map((office) => (
            <OfficeCard key={office.mapsUrl} office={office} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl text-ink">Gestorías</h2>
        <p className="mt-2 text-sm text-ink-soft">La oficina de Leganés también ofrece servicios de gestoría.</p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gestorias.map((office) => (
            <OfficeCard key={office.mapsUrl} office={office} />
          ))}
        </div>
      </section>
    </div>
  );
}
