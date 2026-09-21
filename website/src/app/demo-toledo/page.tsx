/**
 * Ruta de prueba aislada para validar el render de components/toledo-render/
 * antes de tocar la portada real. No sobrescribe app/page.tsx.
 */
import { ToledoHero } from "@/components/toledo-render";

export const metadata = {
  title: "Toledo21 · Prueba del render",
  robots: { index: false, follow: false },
};

export default function DemoToledoPage() {
  return (
    <>
      <ToledoHero
        primaryAction={{ label: "Ver viviendas", href: "#demo-viviendas" }}
        secondaryAction={{ label: "Valora tu casa", href: "#demo-valoracion" }}
      />
      <section
        id="demo-viviendas"
        aria-label="Destino de demostración: viviendas"
        style={{ padding: "40px 24px", background: "#14110f", color: "#f7f4ee" }}
      >
        <h2>Ver viviendas · Demo</h2>
        <p>En producción, utiliza la ruta real del listado de inmuebles de Toledo21.</p>
      </section>
      <section
        id="demo-valoracion"
        aria-label="Destino de demostración: valoración"
        style={{ padding: "40px 24px", background: "#14110f", color: "#f7f4ee" }}
      >
        <h2>Valora tu casa · Demo</h2>
        <p>En producción, utiliza el formulario o la ruta de valoración que ya existe. Esta página no envía datos.</p>
      </section>
    </>
  );
}
