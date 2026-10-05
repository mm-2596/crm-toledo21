import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FileText, MapPin, Paperclip, Phone, Trash2 } from "lucide-react";
import { LeasesApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { DwellingDiary } from "../components/DwellingDiary";
import { dwellingTitle } from "../components/DwellingPanel";
import { LeaseForm } from "../components/LeaseForm";
import { useToast } from "../components/Toast";
import { formatCurrency, formatDate, formatFileSize, leaseStatusLabels, officeLabels } from "../lib/format";
import { endBadge } from "../lib/leases";
import type { LeaseParty } from "../api/types";

function Party({ title, party }: { title: string; party?: LeaseParty | null }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      {party ? (
        <>
          <Link to={`/contactos/${party.id}`} className="font-medium text-[#2a241f] hover:underline">{party.name}</Link>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
            {party.phone && (
              <a href={`tel:${party.phone}`} className="flex items-center gap-1 hover:underline"><Phone size={12} /> {party.phone}</a>
            )}
            {party.email && <a href={`mailto:${party.email}`} className="hover:underline">{party.email}</a>}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400">Sin indicar</p>
      )}
    </div>
  );
}

export function RentalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  const { data: lease, isLoading } = useQuery({ queryKey: ["lease", id], queryFn: () => LeasesApi.get(id as string), enabled: Boolean(id) });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["lease", id] });
    queryClient.invalidateQueries({ queryKey: ["leases"] });
    queryClient.invalidateQueries({ queryKey: ["buildings"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["lease-activities", id] });
  };
  const onError = (error: unknown) => showToast(getErrorMessage(error, "No se pudo guardar"), "error");

  const update = useMutation({
    mutationFn: (data: Parameters<typeof LeasesApi.update>[1]) => LeasesApi.update(id as string, data),
    onSuccess: () => {
      refresh();
      setEditing(false);
      showToast("Alquiler guardado");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: () => LeasesApi.remove(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      navigate("/alquileres", { replace: true });
    },
    onError,
  });
  const upload = useMutation({
    mutationFn: (file: File) => LeasesApi.uploadFile(id as string, file),
    onSuccess: () => {
      refresh();
      showToast("Documento adjuntado");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo subir el archivo (PDF, imagen, Word, Excel o texto de hasta 10 MB)"), "error"),
  });
  const removeFile = useMutation({ mutationFn: LeasesApi.removeFile, onSuccess: refresh, onError });

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!lease) return <p className="text-red-600">Alquiler no encontrado.</p>;

  const { building } = lease.dwelling;
  const badge = lease.status === "VIGENTE" ? endBadge(lease.endDate) : null;

  return (
    <div>
      <Link to="/alquileres" className="text-sm text-[#2a241f] hover:underline">← Volver a alquileres</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">{building.address}</h1>
          <p className="text-sm text-slate-500">
            {dwellingTitle(lease.dwelling)} · {building.name} · Oficina de {officeLabels[building.office]}
          </p>
          <Link to={`/mapa?vivienda=${lease.dwellingId}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#2a241f] hover:underline">
            <MapPin size={12} /> Ver en el mapa
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lease.status === "VIGENTE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{leaseStatusLabels[lease.status]}</span>
          {badge && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.text}</span>}
        </div>
      </div>

      {editing ? (
        <LeaseForm lease={lease} submitLabel="Guardar cambios" pending={update.isPending} onSubmit={(data) => update.mutate(data)} onCancel={() => setEditing(false)} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium text-[#1c1815]">Contrato</h2>
            <div className="flex gap-3 text-xs font-medium">
              <button onClick={() => setEditing(true)} className="text-[#2a241f] hover:underline">Editar</button>
              {lease.status === "VIGENTE" && (
                <button
                  onClick={() => window.confirm("¿Dar este alquiler por finalizado? La vivienda dejará de aparecer como alquilada.") && update.mutate({ ownerId: lease.ownerId, tenantId: lease.tenantId, monthlyRent: lease.monthlyRent, deposit: lease.deposit, startDate: lease.startDate.slice(0, 10), endDate: lease.endDate?.slice(0, 10) ?? null, notes: lease.notes, status: "FINALIZADO" })}
                  className="text-amber-700 hover:underline"
                >
                  Finalizar alquiler
                </button>
              )}
              <button onClick={() => window.confirm("¿Eliminar este alquiler con sus documentos y seguimiento?") && remove.mutate()} className="text-red-600 hover:underline">Eliminar</button>
            </div>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Party title="Propietario" party={lease.owner} />
            <Party title="Arrendatario" party={lease.tenant} />
          </div>
          <dl className="grid grid-cols-2 gap-y-1.5 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-slate-400">Renta mensual</dt><dd className="font-medium tabular-nums text-slate-800">{formatCurrency(lease.monthlyRent)}</dd></div>
            <div><dt className="text-xs text-slate-400">Fianza</dt><dd className="tabular-nums text-slate-800">{lease.deposit != null ? formatCurrency(lease.deposit) : "-"}</dd></div>
            <div><dt className="text-xs text-slate-400">Inicio</dt><dd className="text-slate-800">{formatDate(lease.startDate)}</dd></div>
            <div><dt className="text-xs text-slate-400">Fin</dt><dd className="text-slate-800">{lease.endDate ? formatDate(lease.endDate) : "Sin fecha de fin"}</dd></div>
          </dl>
          {lease.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{lease.notes}</p>}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#1c1815]">Documentos ({lease.files.length})</h2>
          <p className="mb-3 text-xs text-slate-500">Contrato, DNI, seguro, certificados… PDF, imagen, Word, Excel o texto, hasta 10 MB.</p>
          <ul className="flex flex-col gap-1.5">
            {lease.files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm">
                <FileText size={15} className="shrink-0 text-slate-400" />
                <a href={LeasesApi.fileUrl(f.id)} className="min-w-0 flex-1 truncate text-[#2a241f] hover:underline" title={f.name}>{f.name}</a>
                <span className="shrink-0 text-xs text-slate-400">{formatFileSize(f.size)}</span>
                <button onClick={() => window.confirm(`¿Eliminar «${f.name}»?`) && removeFile.mutate(f.id)} aria-label={`Eliminar ${f.name}`} className="shrink-0 text-slate-400 hover:text-red-600">
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
            aria-label="Adjuntar documento"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
              e.target.value = "";
            }}
          />
          <button onClick={() => fileInput.current?.click()} disabled={upload.isPending} className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <Paperclip size={15} /> {upload.isPending ? "Subiendo…" : "Adjuntar documento"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-[#1c1815]">Seguimiento y próximas gestiones</h2>
          <p className="mb-3 text-xs text-slate-500">Anota lo que se va haciendo y programa lo siguiente: renovación, revisión de renta, incidencias, devolución de fianza…</p>
          <DwellingDiary leaseId={lease.id} />
        </div>
      </div>
    </div>
  );
}
