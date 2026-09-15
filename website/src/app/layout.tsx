import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompareProvider } from "@/components/CompareContext";
import { FavoritesProvider } from "@/components/FavoritesContext";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "./globals.css";

const displayFont = Geist({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
});

const bodyFont = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "variable",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteDescription =
  "Propiedades seleccionadas en Getafe y Madrid sur: pisos, casas y chalets con fotografía cuidada, datos completos y un equipo de agentes dedicado.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toledo21 | Inmuebles seleccionados en Getafe",
    template: "%s | Toledo21",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Toledo21",
    title: "Toledo21 | Inmuebles seleccionados en Getafe",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Toledo21 | Inmuebles seleccionados en Getafe",
    description: siteDescription,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-body text-ink antialiased">
        <CompareProvider>
          <FavoritesProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
            <CookieConsentBanner />
          </FavoritesProvider>
        </CompareProvider>
      </body>
    </html>
  );
}
