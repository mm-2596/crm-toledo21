import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de cookies",
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

export default function CookiesPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-28">
      <p className="text-xs font-medium uppercase tracking-wider text-gold">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Política de cookies</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Una cookie es un pequeño archivo que se guarda en tu navegador al visitar una web. Aquí te contamos qué
        usamos en este sitio y para qué.
      </p>

      <Section title="Cookies técnicas y necesarias (siempre activas)">
        <p>
          Son imprescindibles para que el sitio funcione y no requieren tu consentimiento. Solo se usan si accedes
          a la Zona de agentes:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-2 pr-4 font-medium text-ink">Nombre</th>
                <th className="py-2 pr-4 font-medium text-ink">Finalidad</th>
                <th className="py-2 font-medium text-ink">Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/60">
                <td className="py-2 pr-4">toledo21_agent_token</td>
                <td className="py-2 pr-4">Mantener tu sesión iniciada en la Zona de agentes.</td>
                <td className="py-2">7 días</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">toledo21_agent_info</td>
                <td className="py-2 pr-4">Recordar qué agente ha iniciado sesión.</td>
                <td className="py-2">7 días</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Almacenamiento local del navegador (no son cookies, pero cumplen una función similar)">
        <p>
          Usamos el almacenamiento local de tu navegador (localStorage) para recordar tus propiedades favoritas y
          tu selección del comparador. Esta información se queda únicamente en tu dispositivo, no se envía a
          nuestros servidores ni se comparte con nadie, y no requiere registro ni cuenta.
        </p>
      </Section>

      <Section title="Cookies de analítica o publicidad">
        <p>
          Actualmente <strong className="text-ink">no utilizamos</strong> cookies de analítica ni de publicidad de
          terceros. Si en el futuro incorporamos alguna (por ejemplo, para medir visitas de forma anónima), te lo
          pediremos primero mediante el aviso de cookies del sitio, y podrás aceptarlas o rechazarlas.
        </p>
      </Section>

      <Section title="Cómo gestionar o eliminar las cookies">
        <p>
          Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de tu
          navegador: Chrome, Firefox, Safari o Edge tienen opciones específicas para ello en su apartado de
          privacidad. Ten en cuenta que bloquear las cookies técnicas puede impedir el acceso a la Zona de agentes.
        </p>
      </Section>
    </div>
  );
}
