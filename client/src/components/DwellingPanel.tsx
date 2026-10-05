import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, FileText, Paperclip, Pencil, Trash2, UserPlus } from "lucide-react";
import { DwellingsApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { dwellingStatusColors, dwellingStatusLabels, formatDate, formatFileSize, residentRoleLabels, saleStageLabels, saleStages } from "../lib/format";
import { useToast } from "./Toast";
import type { Building, Contact, Dwelling, DwellingStatus, ResidentInput, ResidentRole, SaleStage } from "../api/types";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const EMPTY_RESIDENT: ResidentInput = { name: "", role: "PROPIETARIO", phone: "", email: "", notes: "" };

export function dwellingTitle(d: Pick<Dwelling, "floor" | "door">) {
  return [d.floor && `Planta ${d.floor}`, d.door && `Puerta ${d.door}`].filter(Boolean).join(" · ") || "Vivienda";
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-[#1c1815]">{title}</h3>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className={hint ? "" : "mt-2"}>{children}</div>
    </section>
  );
}

interface Props {
  building: Building;
  dwelling: Dwelling;
  contacts: Pick<Contact, "id" | "name">[];
  onBack: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}

export function DwellingPanel({ building, dwelling, contacts, onBack, onChanged, onDeleted }: Props) {
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const onError = (error: unknown) => showToast(getErrorMessage(error, "No se pudo guardar"), "error");

  const [data, setData] = useState({
    floor: dwelling.floor ?? "",
    door: dwelling.door ?? "",
    contactId: dwelling.contactId ?? "",
    status: dwelling.status as DwellingStatus,
    notes: dwelling.notes ?? "",
  });
  const [resident, setResident] = useState<(ResidentInput & { id?: string }) | null>(null);

  const saveData = useMutation({
    mutationFn: () => DwellingsApi.update(dwelling.id, { ...data, contactId: data.contactId || null }),
    onSuccess: () => {
      onChanged();
      showToast("Vivienda guardada");
    },
    onError,
  });
  const setStage = useMutation({
    mutationFn: (saleStage: SaleStage | null) => DwellingsApi.update(dwelling.id, { saleStage }),
    onSuccess: (updated) => {
      setData((d) => ({ ...d, status: updated.status }));
      onChanged();
    },
    onError,
  });
  const saveResident = useMutation({
    mutationFn: (input: ResidentInput & { id?: string }) => {
      const { id, ...body } = input;
      return id ? DwellingsApi.updateResident(id, body) : DwellingsApi.addResident(dwelling.id, body);
    },
    onSuccess: () => {
      onChanged();
      setResident(null);
      showToast("Persona guardada");
    },
    onError,
  });
  const removeResident = useMutation({ mutationFn: DwellingsApi.removeResident, onSuccess: onChanged, onError });
  const upload = useMutation({
    mutationFn: (file: File) => DwellingsApi.uploadFile(dwelling.id, file),
    onSuccess: () => {
      onChanged();
      showToast("Archivo adjuntado");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo subir el archivo (PDF, imagen, Word, Excel o texto de hasta 10 MB)"), "error"),
  });
  const removeFile = useMutation({ mutationFn: DwellingsApi.removeFile, onSuccess: onChanged, onError });
  const removeDwelling = useMutation({ mutationFn: () => DwellingsApi.remove(dwelling.id), onSuccess: onDeleted, onError });

  const stageIndex = dwelling.saleStage ? saleStages.indexOf(dwelling.saleStage) : -1;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex w-fit items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ArrowLeft size={13} /> {building.name}
      </button>
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-medium text-[#1c1815]">{dwellingTitle(dwelling)}</h2>
          <span
            className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
            style={{ background: `${dwellingStatusColors[dwelling.status]}1a`, color: dwellingStatusColors[dwelling.status], borderColor: `${dwellingStatusColors[dwelling.status]}55` }}
          >
            {dwellingStatusLabels[dwelling.status]}
          </span>
        </div>
        <p className="text-sm text-slate-500">{building.address}{building.city ? `, ${building.city}` : ""}</p>
        {dwelling.contact && (
          <Link to={`/contactos/${dwelling.contact.id}`} className="text-sm text-[#2a241f] hover:underline">
            {dwelling.contact.name}
          </Link>
        )}
      </div>

      <Section title="Seguimiento de venta" hint="Pulsa la fase en la que está. Pasa la vivienda a «A la venta» y, al firmar ante notario, a «Vendida».">
        <ol className="flex flex-col gap-1.5">
          {saleStages.map((stage, i) => {
            const done = i < stageIndex;
            const current = i === stageIndex;
            return (
              <li key={stage}>
                <button
                  onClick={() => setStage.mutate(current ? null : stage)}
                  disabled={setStage.isPending}
                  aria-pressed={current}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    current
                      ? "border-[#1c1815] bg-[#1c1815] text-white"
                      : done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      current ? "bg-white text-[#1c1815]" : done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {done || (current && stage === "FIRMADO_NOTARIO") ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="flex-1">{saleStageLabels[stage]}</span>
                  {current && dwelling.saleStageAt && <span className="text-xs opacity-70">{formatDate(dwelling.saleStageAt)}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        {dwelling.saleStage && (
          <button onClick={() => setStage.mutate(null)} className="mt-2 text-xs text-slate-500 hover:text-red-600 hover:underline">
            Quitar del seguimiento de venta
          </button>
        )}
      </Section>

      <Section title={`Personas en la vivienda (${dwelling.residents.length})`}>
        {dwelling.residents.length === 0 && !resident && <p className="text-xs text-slate-500">Todavía no hay nadie anotado.</p>}
        <ul className="flex flex-col gap-2">
          {dwelling.residents.map((r) => (
            <li key={r.id} className="rounded-lg border border-slate-200 p-2.5 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-[#2a241f]">{r.name}</span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{residentRoleLabels[r.role]}</span>
                </div>
                <div className="flex shrink-0 gap-2 text-slate-400">
                  <button
                    onClick={() => setResident({ id: r.id, name: r.name, role: r.role, phone: r.phone ?? "", email: r.email ?? "", notes: r.notes ?? "" })}
                    aria-label={`Editar a ${r.name}`}
                    className="hover:text-slate-700"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => window.confirm(`¿Quitar a ${r.name} de la vivienda?`) && removeResident.mutate(r.id)}
                    aria-label={`Quitar a ${r.name}`}
                    className="hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {(r.phone || r.email) && (
                <p className="mt-0.5 text-xs text-slate-600">
                  {r.phone && <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a>}
                  {r.phone && r.email && " · "}
                  {r.email && <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>}
                </p>
              )}
              {r.notes && <p className="mt-0.5 text-xs text-slate-500">{r.notes}</p>}
            </li>
          ))}
        </ul>

        {resident ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveResident.mutate(resident);
            }}
            className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3"
          >
            <p className="col-span-2 text-xs font-medium text-slate-600">{resident.id ? "Editar persona" : "Añadir persona"}</p>
            <input required value={resident.name} onChange={(e) => setResident({ ...resident, name: e.target.value })} placeholder="Nombre" aria-label="Nombre de la persona" className={`${inputClass} col-span-2`} />
            <select value={resident.role} onChange={(e) => setResident({ ...resident, role: e.target.value as ResidentRole })} aria-label="Relación con la vivienda" className={`${inputClass} col-span-2`}>
              {Object.entries(residentRoleLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input value={resident.phone ?? ""} onChange={(e) => setResident({ ...resident, phone: e.target.value })} placeholder="Teléfono" className={inputClass} />
            <input type="email" value={resident.email ?? ""} onChange={(e) => setResident({ ...resident, email: e.target.value })} placeholder="Email" className={inputClass} />
            <input value={resident.notes ?? ""} onChange={(e) => setResident({ ...resident, notes: e.target.value })} placeholder="Notas (opcional)" className={`${inputClass} col-span-2`} />
            <button type="submit" disabled={saveResident.isPending} className="rounded-lg bg-[#1c1815] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
              Guardar
            </button>
            <button type="button" onClick={() => setResident(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-white">
              Cancelar
            </button>
          </form>
        ) : (
          <button
            onClick={() => setResident({ ...EMPTY_RESIDENT })}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <UserPlus size={15} /> Añadir persona
          </button>
        )}
      </Section>

      <Section title={`Archivos adjuntos (${dwelling.files.length})`} hint="Escrituras, notas simples, contratos… PDF, imagen, Word, Excel o texto, hasta 10 MB.">
        <ul className="flex flex-col gap-1.5">
          {dwelling.files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm">
              <FileText size={15} className="shrink-0 text-slate-400" />
              <a href={DwellingsApi.fileUrl(f.id)} className="min-w-0 flex-1 truncate text-[#2a241f] hover:underline" title={f.name}>
                {f.name}
              </a>
              <span className="shrink-0 text-xs text-slate-400">{formatFileSize(f.size)}</span>
              <button
                onClick={() => window.confirm(`¿Eliminar «${f.name}»?`) && removeFile.mutate(f.id)}
                aria-label={`Eliminar ${f.name}`}
                className="shrink-0 text-slate-400 hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
          aria-label="Adjuntar archivo"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={upload.isPending}
          className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <Paperclip size={15} /> {upload.isPending ? "Subiendo…" : "Adjuntar archivo"}
        </button>
      </Section>

      <Section title="Datos de la vivienda">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveData.mutate();
          }}
          className="grid grid-cols-2 gap-2"
        >
          <input value={data.floor} onChange={(e) => setData({ ...data, floor: e.target.value })} placeholder="Planta" aria-label="Planta" className={inputClass} />
          <input value={data.door} onChange={(e) => setData({ ...data, door: e.target.value })} placeholder="Puerta" aria-label="Puerta" className={inputClass} />
          <select value={data.contactId} onChange={(e) => setData({ ...data, contactId: e.target.value })} aria-label="Cliente" className={`${inputClass} col-span-2`}>
            <option value="">Sin cliente asignado</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={data.status} onChange={(e) => setData({ ...data, status: e.target.value as DwellingStatus })} aria-label="Estado en el mapa" className={`${inputClass} col-span-2`}>
            {Object.entries(dwellingStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <textarea value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} rows={2} placeholder="Notas" aria-label="Notas" className={`${inputClass} col-span-2`} />
          <button type="submit" disabled={saveData.isPending} className="col-span-2 rounded-lg bg-[#1c1815] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50">
            Guardar datos
          </button>
        </form>
        <button
          onClick={() => window.confirm("¿Eliminar esta vivienda con sus personas y archivos?") && removeDwelling.mutate()}
          className="mt-3 text-xs font-medium text-red-600 hover:underline"
        >
          Eliminar vivienda
        </button>
      </Section>
    </div>
  );
}
