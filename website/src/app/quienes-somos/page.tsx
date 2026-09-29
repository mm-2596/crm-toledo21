import type { Metadata } from "next";
import { AboutContent } from "@/components/AboutContent";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Desde 1997, Toledo21 - Somos Tu Inmobiliaria acompaña a familias y empresas en Getafe y Madrid sur a comprar, vender y alquilar con tranquilidad.",
};

export default function AboutPage() {
  return <AboutContent />;
}
