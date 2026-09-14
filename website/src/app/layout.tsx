import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompareProvider } from "@/components/CompareContext";
import "./globals.css";

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteDescription =
  "Propiedades seleccionadas en Toledo y alrededores: pisos, casas y chalets con fotografía cuidada, datos completos y un equipo de agentes dedicado.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toledo21 | Inmuebles seleccionados en Toledo",
    template: "%s | Toledo21",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Toledo21",
    title: "Toledo21 | Inmuebles seleccionados en Toledo",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Toledo21 | Inmuebles seleccionados en Toledo",
    description: siteDescription,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${displayFont.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-body text-ink antialiased">
        <CompareProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CompareProvider>
      </body>
    </html>
  );
}
