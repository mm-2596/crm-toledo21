import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal",
  robots: { index: false },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function LegalNoticePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-28">
      <p className="text-xs font-medium uppercase tracking-wider text-gold">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Aviso legal</h1>
      <p className="mt-3 text-sm text-ink-soft">
        En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de
        Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).
      </p>

      <Section title="1. Datos identificativos del titular">
        <p>
          <strong className="text-ink">Nombre comercial:</strong> Toledo21 · Somos Tu Inmobiliaria
        </p>
        <p className="rounded-lg border border-dashed border-gold/60 bg-gold-soft/40 p-3 text-ink">
          <strong>[COMPLETAR]</strong> Razón social / nombre y apellidos del titular, NIF o CIF, y datos registrales
          (si procede: Registro Mercantil, tomo, folio, hoja). Pendiente de confirmar con la gestoría antes de
          publicar esta página.
        </p>
        <p>
          <strong className="text-ink">Domicilio:</strong> C. Toledo, 21, 28901 Getafe, Madrid
        </p>
        <p>
          <strong className="text-ink">Correo electrónico:</strong> info@somostuinmobiliaria.es
        </p>
        <p>
          <strong className="text-ink">Teléfono:</strong> 673 49 00 94
        </p>
      </Section>

      <Section title="2. Objeto y ámbito de aplicación">
        <p>
          El presente aviso legal regula el uso del sitio web (en adelante, &ldquo;el sitio&rdquo;), del que es
          titular Toledo21 · Somos Tu Inmobiliaria. La navegación por el sitio atribuye la condición de usuario del
          mismo e implica la aceptación plena de todas las disposiciones incluidas en este aviso legal.
        </p>
        <p>
          A través del sitio se ofrece a los usuarios el acceso a información sobre inmuebles en venta y alquiler,
          servicios de gestoría, y la posibilidad de contactar con la agencia mediante un formulario, sin que ello
          suponga la formalización de ninguna relación contractual por el mero hecho de navegar o enviar dicho
          formulario.
        </p>
      </Section>

      <Section title="3. Condiciones de uso">
        <p>
          El usuario se compromete a hacer un uso adecuado y lícito del sitio, de conformidad con la legislación
          aplicable, este aviso legal, la moral y las buenas costumbres generalmente aceptadas y el orden público.
          Quedan prohibidos, entre otros: el uso del sitio con fines fraudulentos o lesivos, la introducción o
          difusión de virus informáticos, y la realización de acciones que puedan dañar, sobrecargar o impedir el
          funcionamiento normal del sitio.
        </p>
      </Section>

      <Section title="4. Propiedad intelectual e industrial">
        <p>
          Todos los contenidos del sitio (textos, fotografías, imágenes de inmuebles, logotipos, diseño y código
          fuente) son titularidad de Toledo21 o de terceros que han autorizado su uso, y están protegidos por la
          normativa de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o
          comunicación pública total o parcial sin autorización expresa.
        </p>
      </Section>

      <Section title="5. Exclusión de responsabilidad">
        <p>
          La información sobre los inmuebles publicada en el sitio tiene carácter meramente informativo y no
          constituye oferta vinculante. Precios, disponibilidad y características pueden variar; se recomienda
          confirmar cualquier dato con un agente antes de tomar una decisión.
        </p>
        <p>
          Toledo21 no se hace responsable de los daños derivados de la falta de disponibilidad o continuidad del
          sitio, de la presencia de virus u otros elementos lesivos, ni del uso ilícito que terceros puedan hacer de
          los contenidos publicados.
        </p>
      </Section>

      <Section title="6. Enlaces a terceros">
        <p>
          El sitio puede incluir enlaces a páginas de terceros (por ejemplo, Google Maps o WhatsApp). Toledo21 no
          asume responsabilidad alguna por el contenido, políticas de privacidad o prácticas de dichos sitios
          externos.
        </p>
      </Section>

      <Section title="7. Legislación aplicable">
        <p>
          Este aviso legal se rige por la legislación española. Para la resolución de cualquier controversia serán
          competentes los Juzgados y Tribunales del domicilio del usuario, salvo que la normativa aplicable
          disponga otra cosa.
        </p>
      </Section>
    </div>
  );
}
