import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Car, FileCheck, Landmark, Scale, ScrollText } from "lucide-react";

export const metadata: Metadata = {
  title: "Somos Tu Gestoría",
  description:
    "Servicios de gestoría de Toledo21 en Getafe y Leganés: autónomos y sociedades, herencias, trámites de tráfico y asesoría fiscal, financiera y jurídica gratuita.",
};

const SERVICES = [
  {
    icon: Briefcase,
    title: "Autónomos y sociedades",
    description:
      "Chequeo totalmente gratis de tu situación actual. Si decides cambiarte con nosotros, los dos primeros meses de gestoría corren de nuestra cuenta, y te hacemos gratis todos los trámites de inicio, incluida la constitución de tu sociedad.",
  },
  {
    icon: ScrollText,
    title: "Herencias",
    description:
      "Nos hacemos cargo de todos los trámites desde el inicio hasta el final. Si además quieres que gestionemos algún inmueble heredado desde nuestra inmobiliaria, la tramitación puede salirte gratis.",
  },
  {
    icon: Car,
    title: "Compra-venta de vehículos",
    description:
      "Transferencia en el acto y con garantía total tanto para el comprador como para el vendedor, con 30 € de descuento sobre el precio habitual.",
  },
  {
    icon: Landmark,
    title: "Asesoría fiscal",
    description: "Hacemos tu declaración de la renta evitando errores con Hacienda, y presentamos la plusvalía sin coste adicional.",
  },
  {
    icon: Scale,
    title: "Asesoría jurídica y financiera",
    description: "Asesoramiento jurídico y financiero gratuito, y te ayudamos a conseguir el 100% de la financiación para tu vivienda.",
  },
  {
    icon: FileCheck,
    title: "Certificado energético",
    description: "Tramitación del certificado energético, obligatorio para vender o alquilar, totalmente gratuita.",
  },
];

export default function GestoriaPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-28">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Somos Tu Gestoría</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">La cara amable de tu gestoría</h1>
        <p className="mt-3 text-sm text-ink-soft sm:text-base">
          Desde 1997 resolviendo los trámites de nuestros clientes, ya sea que compren, vendan o simplemente
          necesiten poner en orden su situación como autónomo, empresa o herencia.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <div key={service.title} className="rounded-2xl border border-line bg-paper p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-gold">
              <service.icon size={18} />
            </span>
            <h3 className="mt-4 font-display text-lg text-ink">{service.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{service.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-ink px-8 py-12 text-center sm:px-12">
        <h2 className="font-display text-2xl text-paper sm:text-3xl">¿Hablamos de tu caso?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-paper/70">
          Ven a nuestra gestoría en Getafe (C. Toledo, 38) o a la oficina de Leganés, donde también atendemos
          gestoría. Sin compromiso.
        </p>
        <Link
          href="/oficinas"
          className="mt-6 inline-block rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.03]"
        >
          Ver nuestras oficinas
        </Link>
      </div>
    </div>
  );
}
