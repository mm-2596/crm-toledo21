import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Check, Eye, Mail, MessageCircle, Pencil } from "lucide-react";
import { GreetingsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { BirthdaysCard } from "../components/BirthdaysCard";
import { useToast } from "../components/Toast";
import type { GreetingTexts } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const longDate = (iso: string) => new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

function Preview({ keyName }: { keyName: string }) {
  const { data, isLoading } = useQuery({ queryKey: ["greeting-preview", keyName], queryFn: () => GreetingsApi.preview(keyName) });
  if (isLoading) return <p className="text-sm text-slate-500">Preparando la postal…</p>;
  // El correo se enseña aislado: sin scripts y sin acceso al CRM.
  return <iframe title="Vista previa de la postal" sandbox="" srcDoc={data} className="h-[640px] w-full rounded-xl border border-slate-200 bg-white" />;
}

function TemplateEditor({ keyName, template, onClose }: { keyName: string; template: GreetingTexts; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [f, setF] = useState({ subject: template.subject, body: template.body, whatsappText: template.whatsappText });
  const save = useMutation({
    mutationFn: (reset: boolean) => GreetingsApi.saveTemplate(keyName, reset ? { subject: null, body: null, whatsappText: null } : f),
    onSuccess: (_d, reset) => {
      queryClient.invalidateQueries({ queryKey: ["festivities"] });
      queryClient.invalidateQueries({ queryKey: ["greeting-preview", keyName] });
      showToast(reset ? "Mensaje restaurado" : "Mensaje guardado");
      onClose();
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar"), "error"),
  });

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">Escribe <code className="rounded bg-white px-1">{"{{nombre}}"}</code> donde quieras el nombre de pila del cliente. Los párrafos del email se separan con una línea en blanco.</p>
      <label className="text-xs font-medium text-slate-600">
        Asunto y título de la postal
        <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={`${inputClass} mt-1 font-normal`} />
      </label>
      <label className="text-xs font-medium text-slate-600">
        Mensaje del email
        <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={8} className={`${inputClass} mt-1 font-normal`} />
      </label>
      <label className="text-xs font-medium text-slate-600">
        Mensaje de WhatsApp (corto)
        <textarea value={f.whatsappText} onChange={(e) => setF({ ...f, whatsappText: e.target.value })} rows={3} className={`${inputClass} mt-1 font-normal`} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => save.mutate(false)} disabled={save.isPending || !f.subject.trim() || !f.body.trim() || !f.whatsappText.trim()} className="rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-40">
          Guardar mensaje
        </button>
        {template.customized && (
          <button onClick={() => window.confirm("¿Volver al mensaje que viene por defecto?") && save.mutate(true)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white">
            Restaurar el de por defecto
          </button>
        )}
        <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white">Cancelar</button>
      </div>
    </div>
  );
}

function WhatsappList({ keyName }: { keyName: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["greeting-whatsapp", keyName], queryFn: () => GreetingsApi.whatsapp(keyName) });
  const mark = useMutation({
    mutationFn: ({ id, occasion }: { id: string; occasion: string }) => GreetingsApi.markSent(id, occasion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["greeting-whatsapp", keyName] });
      queryClient.invalidateQueries({ queryKey: ["festivities"] });
    },
  });
  if (isLoading || !data) return <p className="mt-3 text-sm text-slate-500">Cargando la lista…</p>;
  const done = data.recipients.filter((r) => r.sent).length;

  return (
    <div className="mt-3 rounded-xl border border-slate-200 p-3">
      {data.recipients.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ningún cliente ha dado su consentimiento para WhatsApp. Márcalo en la ficha de cada cliente («Ha dado su consentimiento para recibir mensajes por WhatsApp»).
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-500">
            {done} de {data.recipients.length} enviados. Pulsa «Abrir WhatsApp»: se abre el chat con el mensaje ya escrito y solo tienes que enviarlo.
            {data.invalidPhones > 0 && ` (${data.invalidPhones} sin teléfono válido)`}
          </p>
          <ul className="divide-y divide-slate-100">
            {data.recipients.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className={r.sent ? "text-slate-400" : "text-[#2a241f]"}>
                  {r.name} <span className="text-xs text-slate-400">{r.phone}</span>
                </span>
                {r.sent ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><Check size={13} /> Enviado</span>
                ) : (
                  <a href={r.url ?? "#"} target="_blank" rel="noopener noreferrer" onClick={() => mark.mutate({ id: r.id, occasion: data.occasion })} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <MessageCircle size={13} /> Abrir WhatsApp
                  </a>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

type Panel = "preview" | "edit" | "whatsapp" | null;

export function Greetings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [open, setOpen] = useState<{ key: string; panel: Panel }>({ key: "", panel: null });
  const { data } = useQuery({ queryKey: ["festivities"], queryFn: GreetingsApi.festivities });

  const toggle = (key: string, panel: Panel) => setOpen((o) => (o.key === key && o.panel === panel ? { key: "", panel: null } : { key, panel }));
  const prepare = useMutation({
    mutationFn: GreetingsApi.createCampaign,
    onSuccess: () => {
      showToast("Campaña creada en borrador: revísala y envíala desde Campañas");
      navigate("/campanas");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo preparar la campaña"), "error"),
  });
  const autoEmail = useMutation({
    mutationFn: (enabled: boolean) => GreetingsApi.saveTemplate("CUMPLEANOS", { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["festivities"] });
      queryClient.invalidateQueries({ queryKey: ["birthdays"] });
    },
  });

  if (!data) return <p className="text-slate-500">Cargando…</p>;
  const birthday = data.birthday;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#1c1815]">Felicitaciones</h1>
      <p className="mb-4 text-sm text-slate-500">
        Postales y mensajes personalizados para las fiestas, y la felicitación de cumpleaños. Solo se escribe a quien ha dado su consentimiento, y cada email lleva nuestros datos y el enlace de baja.
      </p>
      <div className="mb-6 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">{data.audience.email} con consentimiento de email</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">{data.audience.whatsapp} con consentimiento de WhatsApp</span>
      </div>

      <section className="mb-8">
        <h2 className="mb-1 text-lg font-medium text-[#1c1815]">Cumpleaños</h2>
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="flex items-center gap-2 text-sm text-[#2a241f]">
            <input type="checkbox" checked={birthday.template.enabled} onChange={(e) => autoEmail.mutate(e.target.checked)} disabled={autoEmail.isPending} className="h-4 w-4 accent-[#1c1815]" />
            Felicitar automáticamente por email el día del cumpleaños
          </label>
          <span className="text-xs text-slate-500">Entre las 9:00 y las 20:00, solo a quien tiene consentimiento y email.</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => toggle("CUMPLEANOS", "preview")} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Eye size={13} /> Ver postal</button>
            <button onClick={() => toggle("CUMPLEANOS", "edit")} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Pencil size={13} /> Editar mensaje</button>
          </div>
          <div className="w-full">
            {open.key === "CUMPLEANOS" && open.panel === "preview" && <Preview keyName="CUMPLEANOS" />}
            {open.key === "CUMPLEANOS" && open.panel === "edit" && <TemplateEditor keyName="CUMPLEANOS" template={birthday.template} onClose={() => setOpen({ key: "", panel: null })} />}
          </div>
        </div>
        <BirthdaysCard days={60} showEmpty />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-[#1c1815]">Festividades</h2>
        <ul className="flex flex-col gap-3">
          {data.festivities.map((f) => {
            const soon = f.daysLeft <= 14;
            const isOpen = open.key === f.key;
            return (
              <li key={f.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-medium text-[#1c1815]">{f.name}</h3>
                      {soon && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">{f.daysLeft === 0 ? "Hoy" : `Faltan ${f.daysLeft} días`}: toca preparar</span>}
                      {f.template.customized && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">Mensaje personalizado</span>}
                    </div>
                    <p className="text-xs text-slate-500 first-letter:uppercase">{longDate(f.date)}{!soon && ` · en ${f.daysLeft} días`}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggle(f.key, "preview")} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Eye size={13} /> Ver postal</button>
                    <button onClick={() => toggle(f.key, "edit")} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Pencil size={13} /> Editar mensaje</button>
                    <button onClick={() => window.confirm(`Se creará una campaña en borrador de «${f.name}» para ${data.audience.email} clientes con consentimiento. No se envía nada hasta que la confirmes en Campañas. ¿Continuar?`) && prepare.mutate(f.key)} disabled={prepare.isPending} className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2a241f] disabled:opacity-50"><Mail size={13} /> Preparar email</button>
                    <button onClick={() => toggle(f.key, "whatsapp")} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><MessageCircle size={13} /> WhatsApp{f.whatsappSent > 0 ? ` (${f.whatsappSent} ${f.whatsappSent === 1 ? "enviado" : "enviados"})` : ""}</button>
                  </div>
                </div>
                {isOpen && open.panel === "preview" && <div className="mt-3"><Preview keyName={f.key} /></div>}
                {isOpen && open.panel === "edit" && <TemplateEditor keyName={f.key} template={f.template} onClose={() => setOpen({ key: "", panel: null })} />}
                {isOpen && open.panel === "whatsapp" && <WhatsappList keyName={f.key} />}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
