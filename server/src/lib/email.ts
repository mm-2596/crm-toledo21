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

// ---------------------------------------------------------------------------
// Campañas de email marketing
// ---------------------------------------------------------------------------

export interface CampaignContent {
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  /** Postal con la que se viste el correo (ver POSTCARD_THEMES). Sin tema, el correo de campaña de siempre. */
  theme?: string | null;
}

/** Postales de felicitación: colores de la marca con un toque de cada fiesta. */
const POSTCARD_THEMES: Record<string, { from: string; to: string; fg: string; accent: string; ornament: string }> = {
  NAVIDAD: { from: "#1f3d2e", to: "#14110f", fg: "#faf8f4", accent: "#e0b97d", ornament: "&#10022; &nbsp;&#10052;&nbsp; &#10022;" },
  ANIO_NUEVO: { from: "#14110f", to: "#3a2f22", fg: "#faf8f4", accent: "#e0b97d", ornament: "&#10022; &nbsp;&#10022;&nbsp; &#10022;" },
  REYES: { from: "#3b2a5a", to: "#1d1530", fg: "#faf8f4", accent: "#e0b97d", ornament: "&#9733; &nbsp;&#9733;&nbsp; &#9733;" },
  DIA_PADRE: { from: "#1f3a5f", to: "#13243d", fg: "#faf8f4", accent: "#e0b97d", ornament: "&#10022; &nbsp;&#10022;&nbsp; &#10022;" },
  DIA_MADRE: { from: "#8a3b5a", to: "#5c2339", fg: "#fdf6f8", accent: "#f3d3a4", ornament: "&#10048; &nbsp;&#10048;&nbsp; &#10048;" },
  SEMANA_SANTA: { from: "#4d4160", to: "#2c2438", fg: "#faf8f4", accent: "#e0b97d", ornament: "&#10022; &nbsp;&#10022;&nbsp; &#10022;" },
  VERANO: { from: "#c2681f", to: "#8f4510", fg: "#fff8ef", accent: "#ffe2a8", ornament: "&#9728; &nbsp;&#9728;&nbsp; &#9728;" },
  CUMPLEANOS: { from: "#14110f", to: "#3a2f22", fg: "#faf8f4", accent: "#e0b97d", ornament: "&#10022; &nbsp;&#10022;&nbsp; &#10022;" },
};

/** Dónde estamos: se pone al pie de las felicitaciones para que nos tengan presentes. */
const OFFICE_CARD = [
  { name: "Getafe", address: "C. Toledo, 21", phone: "916 95 84 22", maps: "Toledo21 C. Toledo 21 Getafe" },
  { name: "Leganés", address: "Av. Rey Juan Carlos I, 26", phone: "910 08 21 21", maps: "Toledo21 Av. Rey Juan Carlos I 26 Leganés" },
  { name: "Las Rozas (gestoría)", address: "C. Esperanza, 2, Local 4", phone: "", maps: "C. Esperanza 2 Las Rozas de Madrid" },
  { name: "Puerto de Sagunto", address: "Av. Hispanitat, 5", phone: "", maps: "Toledo21 Av. Hispanitat 5 Puerto de Sagunto" },
];

function officeCardHtml() {
  const rows = OFFICE_CARD.map((o) => {
    const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.maps)}`;
    return `<tr>
      <td style="padding:5px 12px 5px 0;font-size:13px;color:#14110f;white-space:nowrap;vertical-align:top;"><strong>${escapeHtml(o.name)}</strong></td>
      <td style="padding:5px 0;font-size:13px;color:#4a443d;">${escapeHtml(o.address)}${o.phone ? ` · ${escapeHtml(o.phone)}` : ""} · <a href="${link}" style="color:#8a6a3b;">Cómo llegar</a></td>
    </tr>`;
  }).join("");
  return `<p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8a8378;">Dónde estamos</p>
    <table role="presentation" style="border-collapse:collapse;">${rows}</table>
    <p style="margin:10px 0 0 0;font-size:13px;"><a href="${escapeHtml(WEBSITE_URL)}" style="color:#8a6a3b;">${escapeHtml(WEBSITE_URL.replace(/^https?:\/\//, ""))}</a></p>`;
}

function personalizeText(text: string, name: string) {
  const first = name.trim().split(/\s+/)[0] || "";
  return text.replace(/\{\{\s*nombre\s*\}\}/gi, first);
}

export interface CampaignMessage {
  to: string;
  name: string;
  unsubscribeUrl: string;
}

export function isSafeHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** El cuerpo se escribe como texto plano: los párrafos se separan con una línea en blanco y {{nombre}} se sustituye por el nombre de pila. */
export function renderCampaignHtml(content: CampaignContent, name: string, unsubscribeUrl: string) {
  const firstName = escapeHtml(name.trim().split(/\s+/)[0] || "");
  const paragraphs = content.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const html = escapeHtml(p).replace(/\{\{\s*nombre\s*\}\}/gi, firstName).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4a443d;">${html}</p>`;
    })
    .join("");

  const cta =
    content.ctaLabel && isSafeHttpUrl(content.ctaUrl)
      ? `<tr><td style="padding:8px 32px 32px 32px;"><a href="${escapeHtml(content.ctaUrl)}" style="display:inline-block;background:#14110f;color:#faf8f4;text-decoration:none;font-size:14px;font-weight:600;padding:13px 26px;border-radius:999px;">${escapeHtml(content.ctaLabel)}</a></td></tr>`
      : "";

  const title = escapeHtml(personalizeText(content.subject, name));
  const theme = content.theme ? POSTCARD_THEMES[content.theme] : undefined;

  // Con postal: banda de color con el título grande en lugar del título normal.
  const heading = theme
    ? `<tr><td align="center" bgcolor="${theme.from}" style="background-color:${theme.from};background-image:linear-gradient(135deg,${theme.from},${theme.to});padding:44px 28px;text-align:center;">
        <p style="margin:0 0 14px 0;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${theme.accent};">Toledo21 &middot; Somos Tu Inmobiliaria</p>
        <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;font-weight:normal;color:${theme.fg};">${title}</h1>
        <p style="margin:18px 0 0 0;font-size:20px;letter-spacing:0.4em;color:${theme.accent};">${theme.ornament}</p>
      </td></tr>`
    : `<tr><td style="padding:24px 32px 12px 32px;"><h1 style="margin:0;font-size:22px;line-height:1.3;color:#14110f;">${title}</h1></td></tr>`;
  const logo = `<tr><td style="padding:28px 32px ${theme ? "20px" : "0"} 32px;"><img src="${WEBSITE_URL}/logo/toledo21-wordmark.png" alt="Toledo21" height="34" style="height:34px;width:auto;display:block;border-radius:3px;" /></td></tr>`;

  const footer = theme
    ? `<tr><td style="padding:22px 32px;border-top:1px solid #e4ddd0;">${officeCardHtml()}
        <p style="margin:16px 0 0 0;font-size:12px;line-height:1.7;color:#8a8378;">
          Recibes este email porque aceptaste recibir comunicaciones de Toledo21.
          <a href="${escapeHtml(unsubscribeUrl)}" style="color:#8a8378;">Darme de baja</a>
        </p>
      </td></tr>`
    : `<tr><td style="padding:20px 32px;border-top:1px solid #e4ddd0;">
        <p style="margin:0;font-size:12px;line-height:1.7;color:#8a8378;">
          Toledo21 · Somos Tu Inmobiliaria · C. Toledo, 21, 28901 Getafe, Madrid<br />
          Recibes este email porque aceptaste recibir comunicaciones de Toledo21.
          <a href="${escapeHtml(unsubscribeUrl)}" style="color:#8a8378;">Darme de baja</a>
        </p>
      </td></tr>`;

  return `
  <div style="background:#f1ede4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#faf8f4;border-radius:16px;overflow:hidden;border:1px solid #e4ddd0;">
      ${logo}
      ${heading}
      <tr><td style="padding:${theme ? "28px" : "0"} 32px 16px 32px;">${paragraphs}</td></tr>
      ${cta}
      ${footer}
    </table>
  </div>`;
}

/** Envía un lote (Resend admite hasta 100 correos por petición). Devuelve un error por lote, no por destinatario. */
export async function sendCampaignBatch(
  content: CampaignContent,
  messages: CampaignMessage[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY no configurada" };
  try {
    const { error } = await resend.batch.send(
      messages.map((m) => ({
        from: FROM_EMAIL,
        to: m.to,
        subject: personalizeText(content.subject, m.name),
        html: renderCampaignHtml(content, m.name, m.unsubscribeUrl),
        headers: {
          "List-Unsubscribe": `<${m.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      })),
    );
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// ---------------------------------------------------------------------------
// Avisos a los agentes: recordatorio de una tarea y resumen de la agenda del día
// ---------------------------------------------------------------------------

export const ACTIVITY_LABELS: Record<string, string> = {
  LLAMADA: "Llamada",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  VISITA: "Visita",
  REUNION: "Reunión",
  TAREA: "Tarea",
  NOTA: "Nota",
};

function agentMailShell(title: string, inner: string, crmUrl: string) {
  return `
  <div style="background:#f1ede4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#faf8f4;border-radius:16px;border:1px solid #e4ddd0;padding:28px 32px;">
      <h1 style="margin:0 0 16px 0;font-size:19px;color:#14110f;">${escapeHtml(title)}</h1>
      ${inner}
      ${crmUrl ? `<a href="${escapeHtml(crmUrl)}" style="display:inline-block;margin-top:18px;background:#14110f;color:#faf8f4;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">Abrir el CRM</a>` : ""}
    </div>
  </div>`;
}

export interface AgendaLine {
  type: string;
  description: string;
  when: string;
  contactName?: string | null;
}

function agendaRows(lines: AgendaLine[]) {
  return lines
    .map(
      (l) => `<tr>
        <td style="padding:8px 14px 8px 0;font-size:13px;color:#8a8378;white-space:nowrap;vertical-align:top;">${escapeHtml(l.when)}</td>
        <td style="padding:8px 0;font-size:14px;color:#14110f;"><strong>${escapeHtml(ACTIVITY_LABELS[l.type] ?? l.type)}</strong>: ${escapeHtml(l.description)}${l.contactName ? `<br /><span style="color:#8a8378;font-size:13px;">${escapeHtml(l.contactName)}</span>` : ""}</td>
      </tr>`,
    )
    .join("");
}

async function sendAgentMail(to: string[], subject: string, html: string) {
  if (to.length === 0) return false;
  if (!resend) {
    console.warn("RESEND_API_KEY no configurada: no se envió el aviso a los agentes.");
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) console.error("Error enviando aviso a agentes:", error.message);
    return !error;
  } catch (err) {
    console.error("Error enviando aviso a agentes:", err);
    return false;
  }
}

export function sendReminderEmail(to: string[], line: AgendaLine, crmUrl: string) {
  const html = agentMailShell(
    `Dentro de poco: ${ACTIVITY_LABELS[line.type] ?? line.type}`,
    `<table role="presentation" style="border-collapse:collapse;">${agendaRows([line])}</table>`,
    crmUrl,
  );
  return sendAgentMail(to, `${ACTIVITY_LABELS[line.type] ?? "Aviso"} ${line.when.split(", ").pop()}: ${line.description}`.slice(0, 150), html);
}

export function sendDigestEmail(to: string[], name: string, today: AgendaLine[], overdue: AgendaLine[], crmUrl: string, birthdays: string[] = []) {
  const first = escapeHtml(name.trim().split(/\s+/)[0] || "");
  const inner = `
    ${today.length ? `<p style="margin:0 0 6px 0;font-size:14px;color:#4a443d;">Esto es lo que tienes hoy, ${first}:</p><table role="presentation" style="border-collapse:collapse;">${agendaRows(today)}</table>` : `<p style="margin:0;font-size:14px;color:#4a443d;">Hoy no tienes nada con fecha, ${first}.</p>`}
    ${overdue.length ? `<p style="margin:18px 0 6px 0;font-size:14px;color:#b45309;">Pendientes de días anteriores (${overdue.length}):</p><table role="presentation" style="border-collapse:collapse;">${agendaRows(overdue.slice(0, 8))}</table>` : ""}
    ${birthdays.length ? `<p style="margin:18px 0 6px 0;font-size:14px;color:#4a443d;"><strong>Hoy cumplen años</strong> (los que tienen consentimiento reciben nuestra felicitación por email; a los demás, felicítalos tú):</p><p style="margin:0;font-size:14px;color:#14110f;">${birthdays.map(escapeHtml).join(" · ")}</p>` : ""}`;
  return sendAgentMail(to, `Tu agenda de hoy (${today.length} ${today.length === 1 ? "tarea" : "tareas"}${birthdays.length ? `, ${birthdays.length} ${birthdays.length === 1 ? "cumpleaños" : "cumpleaños"}` : ""})`, agentMailShell("Tu agenda de hoy", inner, crmUrl));
}
