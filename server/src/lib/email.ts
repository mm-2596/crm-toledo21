import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Toledo21 <onboarding@resend.dev>";
const WEBSITE_URL = process.env.WEBSITE_URL || "https://crm-toledo21.vercel.app";

function leadConfirmationHtml(name: string) {
  const logoUrl = `${WEBSITE_URL}/logo/toledo21-logo.png`;
  return `
  <div style="background:#f1ede4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#faf8f4;border-radius:16px;overflow:hidden;border:1px solid #e4ddd0;">
      <tr>
        <td style="padding:32px 32px 0 32px;text-align:left;">
          <img src="${logoUrl}" alt="Toledo21" height="34" style="height:34px;width:auto;display:block;" />
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 8px 32px;">
          <h1 style="margin:0;font-size:20px;line-height:1.3;color:#14110f;font-weight:700;">
            Hemos recibido tu mensaje, ${name.split(" ")[0]}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px 32px;">
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#4a443d;">
            Gracias por escribirnos. Un agente de Toledo21 va a revisar tu consulta y se pondrá en contacto contigo
            en menos de 24 horas.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#4a443d;">
            Si mientras tanto quieres seguir mirando propiedades, puedes hacerlo aquí:
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px 32px;">
          <a href="${WEBSITE_URL}/propiedades"
             style="display:inline-block;background:#14110f;color:#faf8f4;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">
            Ver propiedades
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #e4ddd0;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8a8378;">
            Toledo21 · Toledo, España · hola@toledo21.com<br />
            Este es un correo automático de confirmación, no hace falta que lo respondas.
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface LeadAlert {
  isValuation: boolean;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  contactUrl: string;
}

/** Avisa al equipo de que ha entrado un contacto nuevo desde la web. Los destinatarios salen de LEAD_ALERT_EMAILS (separados por comas). */
export async function sendNewLeadAlertEmail(lead: LeadAlert) {
  const recipients = (process.env.LEAD_ALERT_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    console.warn("LEAD_ALERT_EMAILS no configurada: no se avisó al equipo del nuevo contacto.");
    return;
  }
  if (!resend) {
    console.warn("RESEND_API_KEY no configurada: no se avisó al equipo del nuevo contacto.");
    return;
  }

  const title = lead.isValuation ? "Nueva solicitud de tasación gratuita" : "Nuevo contacto desde la web";
  const rows = [
    ["Nombre", lead.name],
    ["Teléfono", lead.phone],
    ["Email", lead.email],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8a8378;font-size:13px;">${k}</td><td style="padding:4px 0;font-size:14px;color:#14110f;">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  const html = `
  <div style="background:#f1ede4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#faf8f4;border-radius:16px;border:1px solid #e4ddd0;padding:28px 32px;">
      <h1 style="margin:0 0 4px 0;font-size:19px;color:#14110f;">${title}</h1>
      ${lead.isValuation ? `<p style="margin:0 0 16px 0;font-size:13px;color:#8a8378;">Prometimos respuesta en menos de 24 horas.</p>` : ""}
      <table role="presentation" style="margin:12px 0;">${rows}</table>
      ${lead.message ? `<pre style="white-space:pre-wrap;margin:16px 0;padding:14px;background:#f1ede4;border-radius:10px;font:13px/1.6 inherit;color:#4a443d;">${escapeHtml(lead.message)}</pre>` : ""}
      <a href="${lead.contactUrl}" style="display:inline-block;background:#14110f;color:#faf8f4;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">Abrir en el CRM</a>
    </div>
  </div>`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: `${lead.isValuation ? "Tasación gratuita" : "Nuevo contacto web"}: ${lead.name}`,
      html,
    });
  } catch (err) {
    console.error("Error enviando el aviso de nuevo contacto:", err);
  }
}

export async function sendLeadConfirmationEmail(to: string, name: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY no configurada: no se envió el correo de confirmación al lead.");
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Hemos recibido tu mensaje — Toledo21",
      html: leadConfirmationHtml(name),
    });
  } catch (err) {
    console.error("Error enviando correo de confirmación de lead:", err);
  }
}
