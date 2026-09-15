import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
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

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-28">
      <p className="text-xs font-medium uppercase tracking-wider text-gold">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Política de privacidad</h1>
      <p className="mt-3 text-sm text-ink-soft">
        De conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de Protección de Datos
        Personales y garantía de los derechos digitales (LOPDGDD).
      </p>

      <Section title="1. Responsable del tratamiento">
        <p>
          <strong className="text-ink">Nombre comercial:</strong> Toledo21 · Somos Tu Inmobiliaria
        </p>
        <p className="rounded-lg border border-dashed border-gold/60 bg-gold-soft/40 p-3 text-ink">
          <strong>[COMPLETAR]</strong> Razón social / nombre y apellidos del titular y NIF o CIF — mismo dato
          pendiente que en el Aviso Legal.
        </p>
        <p>
          <strong className="text-ink">Domicilio:</strong> C. Toledo, 21, 28901 Getafe, Madrid
        </p>
        <p>
          <strong className="text-ink">Contacto para temas de privacidad:</strong> info@somostuinmobiliaria.es
        </p>
      </Section>

      <Section title="2. ¿Qué datos tratamos y con qué finalidad?">
        <p>
          <strong className="text-ink">Formulario de contacto y solicitudes de información sobre inmuebles.</strong>{" "}
          Tratamos el nombre, email, teléfono y mensaje que nos facilitas voluntariamente para responder a tu
          consulta, ponerte en contacto con un agente y, si procede, gestionar la compraventa o alquiler de un
          inmueble. Estos datos se incorporan a nuestro CRM interno.
        </p>
        <p>
          <strong className="text-ink">Reseñas sobre agentes.</strong> Si dejas una reseña en la ficha de un
          agente, el nombre que indiques y el texto de tu reseña se revisan por un administrador antes de
          publicarse, y una vez aprobados se muestran públicamente en esa ficha. No publiques datos que no quieras
          que sean visibles para cualquier visitante.
        </p>
        <p>
          <strong className="text-ink">Cuentas de agentes.</strong> Si trabajas con nosotros y tienes acceso al
          CRM, tratamos tu nombre, email, teléfono, foto y biografía profesional para gestionar tu cuenta y, si lo
          autorizas, mostrar tu ficha pública en el directorio de agentes.
        </p>
      </Section>

      <Section title="3. Legitimación">
        <p>
          La base legal para el tratamiento de tus datos es tu <strong className="text-ink">consentimiento</strong>,
          prestado al enviar voluntariamente el formulario de contacto o una reseña, y el{" "}
          <strong className="text-ink">interés legítimo</strong> de gestionar la relación comercial cuando ya eres
          cliente o colaborador.
        </p>
      </Section>

      <Section title="4. ¿Con quién compartimos tus datos?">
        <p>
          No cedemos tus datos a terceros salvo obligación legal. Utilizamos los siguientes proveedores, que actúan
          como encargados del tratamiento bajo contrato:
        </p>
        <ul className="list-disc pl-5">
          <li>Resend (envío del correo automático de confirmación al enviar el formulario de contacto).</li>
          <li>Vercel y Railway (alojamiento técnico de la web y del CRM).</li>
        </ul>
      </Section>

      <Section title="5. Plazo de conservación">
        <p>
          Conservamos tus datos mientras exista una relación comercial o de interés legítimo, y posteriormente
          durante los plazos legalmente exigibles. Si tu consulta no prospera, conservamos los datos el tiempo
          razonable para poder retomar el contacto, y los eliminamos a tu solicitud.
        </p>
      </Section>

      <Section title="6. Tus derechos">
        <p>
          Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, oposición,
          limitación del tratamiento y portabilidad de tus datos escribiendo a{" "}
          <a href="mailto:info@somostuinmobiliaria.es" className="text-ink underline underline-offset-2">
            info@somostuinmobiliaria.es
          </a>
          , indicando el derecho que quieres ejercer y adjuntando copia de un documento que acredite tu identidad.
        </p>
        <p>
          Si consideras que el tratamiento de tus datos no se ajusta a la normativa, tienes derecho a presentar una
          reclamación ante la Agencia Española de Protección de Datos (
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noreferrer"
            className="text-ink underline underline-offset-2"
          >
            www.aepd.es
          </a>
          ).
        </p>
      </Section>

      <Section title="7. Procedencia de los datos">
        <p>
          Todos los datos que tratamos proceden directamente de ti, a través de los formularios y funcionalidades
          descritos en esta política.
        </p>
      </Section>

      <Section title="8. Menores de edad">
        <p>Los servicios ofrecidos en este sitio están dirigidos a mayores de edad.</p>
      </Section>

      <Section title="9. Cookies">
        <p>
          Este sitio utiliza cookies propias y, en su caso, de terceros. Puedes consultar el detalle en nuestra{" "}
          <a href="/cookies" className="text-ink underline underline-offset-2">
            Política de cookies
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
