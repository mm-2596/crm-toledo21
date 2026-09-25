import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Send, Trash2, Pencil } from "lucide-react";
import { CampaignsApi } from "../api/endpoints";
import { contactSourceLabels, formatDate, priorityLabels, propertyTypeLabels } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import type { Campaign, CampaignSegment, CampaignInput, ContactSource } from "../api/types";

const SOURCES = Object.keys(contactSourceLabels) as ContactSource[];

const STATUS_STYLES: Record<Campaign["status"], string> = {
  BORRADOR: "bg-slate-100 text-slate-600",
  ENVIANDO: "bg-amber-50 text-amber-700",
  ENVIADA: "bg-emerald-50 text-emerald-700",
};
const STATUS_LABELS: Record<Campaign["status"], string> = {
  BORRADOR: "Borrador",
  ENVIANDO: "Enviando…",
  ENVIADA: "Enviada",
};

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

function errorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return message || fallback;
}

interface Draft {
  id?: string;
  name: string;
  subject: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  segment: CampaignSegment;
}

const EMPTY_DRAFT: Draft = { name: "", subject: "", body: "", ctaLabel: "", ctaUrl: "", segment: {} };

function toInput(draft: Draft): CampaignInput {
  return {
    name: draft.name,
    subject: draft.subject,
    body: draft.body,
    ctaLabel: draft.ctaLabel || null,
    ctaUrl: draft.ctaUrl || null,
    segment: draft.segment,
  };
}

export function Campaigns() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: CampaignsApi.list,
    refetchInterval: (query) => (query.state.data?.some((c) => c.status === "ENVIANDO") ? 3000 : false),
  });

  const { data: audience } = useQuery({
    queryKey: ["campaign-audience", draft?.segment],
    queryFn: () => CampaignsApi.audience(draft?.segment ?? {}),
    enabled: Boolean(draft),
  });

  const { data: detail } = useQuery({
    queryKey: ["campaign", detailId],
    queryFn: () => CampaignsApi.get(detailId as string),
    enabled: Boolean(detailId),
  });

  const save = useMutation({
    mutationFn: (d: Draft) => (d.id ? CampaignsApi.update(d.id, toInput(d)) : CampaignsApi.create(toInput(d))),
    onError: (err) => showToast(errorMessage(err, "No se pudo guardar la campaña")),
  });

  const remove = useMutation({
    mutationFn: CampaignsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      showToast("Campaña eliminada");
    },
    onError: (err) => showToast(errorMessage(err, "No se pudo eliminar")),
  });

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function updateSegment(patch: Partial<CampaignSegment>) {
    setDraft((d) => {
      if (!d) return d;
      const segment = { ...d.segment, ...patch };
      (Object.keys(segment) as (keyof CampaignSegment)[]).forEach((k) => {
        const v = segment[k];
        if (v === undefined || v === "" || v === false || (Array.isArray(v) && v.length === 0)) delete segment[k];
      });
      return { ...d, segment };
    });
  }

  function toggleSource(source: ContactSource) {
    const current = draft?.segment.sources ?? [];
    updateSegment({ sources: current.includes(source) ? current.filter((s) => s !== source) : [...current, source] });
  }

  async function saveDraft(): Promise<Campaign | null> {
    if (!draft) return null;
    if (!draft.name.trim() || !draft.subject.trim() || !draft.body.trim()) {
      showToast("Rellena el nombre, el asunto y el mensaje");
      return null;
    }
    const saved = await save.mutateAsync(draft).catch(() => null);
    if (saved) {
      setDraft((d) => (d ? { ...d, id: saved.id } : d));
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    }
    return saved;
  }

  async function handleSaveClick() {
    const saved = await saveDraft();
    if (saved) showToast("Borrador guardado");
  }

  async function handleTest() {
    if (!testEmail.trim()) return showToast("Escribe un email para la prueba");
    const saved = await saveDraft();
    if (!saved) return;
    try {
      await CampaignsApi.sendTest(saved.id, testEmail.trim());
      showToast(`Prueba enviada a ${testEmail.trim()}`);
    } catch (err) {
      showToast(errorMessage(err, "No se pudo enviar la prueba"));
    }
  }

  async function handleSend() {
    const count = audience?.count ?? 0;
    if (count === 0) return showToast("No hay contactos con consentimiento en esta audiencia");
    if (!window.confirm(`Vas a enviar esta campaña a ${count} contacto${count === 1 ? "" : "s"}. No se puede deshacer. ¿Continuar?`)) return;
    const saved = await saveDraft();
    if (!saved) return;
    try {
      const res = await CampaignsApi.send(saved.id);
      showToast(`Enviando a ${res.recipients} contactos…`);
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (err) {
      showToast(errorMessage(err, "No se pudo enviar la campaña"));
    }
  }

  function editCampaign(c: Campaign) {
    setDraft({
      id: c.id,
      name: c.name,
      subject: c.subject,
      body: c.body,
      ctaLabel: c.ctaLabel ?? "",
      ctaUrl: c.ctaUrl ?? "",
      segment: c.segment ?? {},
    });
  }

  const busy = save.isPending;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Campañas de email</h1>
        {!draft && (
          <button
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
            className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f]"
          >
            <Megaphone size={16} /> Nueva campaña
          </button>
        )}
      </div>
      <p className="mb-6 max-w-2xl text-sm text-slate-500">
        Envía novedades e inmuebles por email. Solo recibirán la campaña los contactos que hayan dado su consentimiento
        y no se hayan dado de baja; cada correo incluye un enlace de baja.
      </p>

      {draft && (
        <div className="mb-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-[#1c1815]">{draft.id ? "Editar campaña" : "Nueva campaña"}</h2>
            <input value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="Nombre interno (ej. Novedades octubre)" className={inputClass} />
            <input value={draft.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Asunto del email" className={inputClass} />
            <textarea
              value={draft.body}
              onChange={(e) => update("body", e.target.value)}
              rows={9}
              placeholder={"Hola {{nombre}},\n\nEscribe aquí tu mensaje. Deja una línea en blanco para separar párrafos."}
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-3">
              <input value={draft.ctaLabel} onChange={(e) => update("ctaLabel", e.target.value)} placeholder="Texto del botón (opcional)" className={inputClass} />
              <input value={draft.ctaUrl} onChange={(e) => update("ctaUrl", e.target.value)} placeholder="https:// enlace del botón" className={inputClass} />
            </div>

            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-medium text-[#1c1815]">¿A quién se envía?</h3>
              <div className="mb-3 flex flex-wrap gap-2">
                {SOURCES.map((s) => {
                  const active = draft.segment.sources?.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSource(s)}
                      className={`rounded-full border px-3 py-1 text-xs ${active ? "border-[#1c1815] bg-[#1c1815] text-white" : "border-slate-300 bg-white text-slate-600"}`}
                    >
                      {contactSourceLabels[s]}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <select value={draft.segment.listingType ?? ""} onChange={(e) => updateSegment({ listingType: (e.target.value || undefined) as CampaignSegment["listingType"] })} className={inputClass}>
                  <option value="">Compra y alquiler</option>
                  <option value="VENTA">Compra</option>
                  <option value="ALQUILER">Alquiler</option>
                </select>
                <select value={draft.segment.propertyType ?? ""} onChange={(e) => updateSegment({ propertyType: (e.target.value || undefined) as CampaignSegment["propertyType"] })} className={inputClass}>
                  <option value="">Cualquier tipo</option>
                  {Object.entries(propertyTypeLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <select value={draft.segment.priority ?? ""} onChange={(e) => updateSegment({ priority: (e.target.value || undefined) as CampaignSegment["priority"] })} className={inputClass}>
                  <option value="">Cualquier prioridad</option>
                  {Object.entries(priorityLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <input value={draft.segment.zone ?? ""} onChange={(e) => updateSegment({ zone: e.target.value })} placeholder="Zona (ej. Getafe)" className={inputClass} />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={Boolean(draft.segment.onlyValuations)} onChange={(e) => updateSegment({ onlyValuations: e.target.checked })} />
                Solo quienes pidieron una tasación gratuita
              </label>
              <p className="mt-3 text-sm text-[#1c1815]">
                <strong>{audience?.count ?? "…"}</strong> contactos recibirán esta campaña.
              </p>
              {audience && (audience.withoutConsent > 0 || audience.unsubscribed > 0) && (
                <p className="mt-1 text-xs text-slate-500">
                  Quedan fuera {audience.withoutConsent} con email pero sin consentimiento y {audience.unsubscribed} que se dieron de baja.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button onClick={handleSaveClick} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Guardar borrador
              </button>
              <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} type="email" placeholder="Tu email para la prueba" className="w-52 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button onClick={handleTest} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Enviar prueba
              </button>
              <button onClick={handleSend} disabled={busy} className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
                <Send size={15} /> Enviar campaña
              </button>
              <button onClick={() => setDraft(null)} className="text-sm text-slate-500 hover:text-slate-700">Cerrar</button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-slate-500">Vista previa</h3>
            <div className="rounded-2xl border border-[#e4ddd0] bg-[#faf8f4] p-6">
              <p className="text-lg font-bold text-[#14110f]">{draft.subject || "Asunto del email"}</p>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#4a443d]">
                {(draft.body || "Aquí verás tu mensaje.").split(/\n\s*\n/).map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p.replace(/\{\{\s*nombre\s*\}\}/gi, "María")}</p>
                ))}
              </div>
              {draft.ctaLabel && (
                <span className="mt-5 inline-block rounded-full bg-[#14110f] px-5 py-2.5 text-sm font-semibold text-[#faf8f4]">{draft.ctaLabel}</span>
              )}
              <p className="mt-6 border-t border-[#e4ddd0] pt-3 text-xs text-[#8a8378]">
                Toledo21 · Somos Tu Inmobiliaria · Recibes este email porque aceptaste recibir comunicaciones. Darme de baja
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (campaigns ?? []).length === 0 ? (
        <EmptyState icon={Megaphone} title="Todavía no hay campañas" description='Pulsa "Nueva campaña" para escribir tu primer email.' />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Campaña</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Enviados</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(campaigns ?? []).map((c) => (
                <tr key={c.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#2a241f]">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.subject}</div>
                    {detailId === c.id && detail?.sends && detail.sends.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-red-600">
                        {detail.sends.map((s) => (
                          <li key={s.id}>{s.email}: {s.error}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.status === "BORRADOR" ? "-" : `${c.sentCount} de ${c.recipientCount}`}
                    {c.failedCount > 0 && (
                      <button onClick={() => setDetailId(detailId === c.id ? null : c.id)} className="ml-2 text-xs text-red-600 underline">
                        {c.failedCount} con error
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.sentAt ?? c.createdAt)}</td>
                  <td className="px-4 py-3">
                    {c.status === "BORRADOR" && (
                      <div className="flex justify-end gap-3 text-slate-500">
                        <button onClick={() => editCampaign(c)} title="Editar" aria-label="Editar"><Pencil size={15} /></button>
                        <button
                          onClick={() => window.confirm("¿Eliminar este borrador?") && remove.mutate(c.id)}
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
