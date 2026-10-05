import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { KeyRound, Plus, Search } from "lucide-react";
import { LeasesApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { LeaseForm } from "../components/LeaseForm";
import { useToast } from "../components/Toast";
import { useAuth } from "../auth/AuthContext";
import { dwellingTitle } from "../components/DwellingPanel";
import { formatCurrency, formatDate, leaseStatusLabels, officeLabels } from "../lib/format";
import { endBadge } from "../lib/leases";
import type { LeaseInput, Office } from "../api/types";

export function Rentals() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "VIGENTE" | "FINALIZADO">("VIGENTE");
  const [ending, setEnding] = useState(false);
  const [office, setOffice] = useState<Office | "">("");
  const [creating, setCreating] = useState(false);
  const [presetDwelling, setPresetDwelling] = useState<string | null>(null);
  const canPickOffice = user?.role === "ADMIN" || !user?.office;

  // Enlace desde la ficha de una vivienda: /alquileres?vivienda=ID abre el formulario con esa vivienda.
  const linkedDwelling = searchParams.get("vivienda");
  useEffect(() => {
    if (!linkedDwelling) return;
    setPresetDwelling(linkedDwelling);
    setCreating(true);
    setSearchParams({}, { replace: true });
  }, [linkedDwelling, setSearchParams]);

  const { data: leases = [], isLoading } = useQuery({
    queryKey: ["leases", q, status, ending, office],
    queryFn: () => LeasesApi.list({ q: q.trim() || undefined, status: ending ? undefined : status || undefined, endingWithin: ending ? 90 : undefined, office: office || undefined }),
  });
  const { data: allActive = [] } = useQuery({ queryKey: ["leases", "stats", office], queryFn: () => LeasesApi.list({ status: "VIGENTE", office: office || undefined }) });

  const create = useMutation({
    mutationFn: ({ data, dwellingId }: { data: LeaseInput; dwellingId: string }) => LeasesApi.create({ ...data, dwellingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setCreating(false);
      setPresetDwelling(null);
      showToast("Alquiler creado");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo crear el alquiler"), "error"),
  });

  const monthlyTotal = allActive.reduce((sum, l) => sum + l.monthlyRent, 0);
  const endingSoon = allActive.filter((l) => endBadge(l.endDate)).length;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Alquileres</h1>
        <button onClick={() => setCreating((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f]">
          <Plus size={16} /> {creating ? "Cancelar" : "Nuevo alquiler"}
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-500">Viviendas alquiladas con su propietario, arrendatario, contrato, documentos y seguimiento.</p>

      {creating && (
        <div className="mb-6">
          <LeaseForm
            presetDwellingId={presetDwelling}
            submitLabel="Crear alquiler"
            pending={create.isPending}
            onSubmit={(data, dwellingId) => create.mutate({ data, dwellingId })}
            onCancel={() => {
              setCreating(false);
              setPresetDwelling(null);
            }}
          />
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Alquileres vigentes", value: allActive.length },
          { label: "Renta mensual total", value: formatCurrency(monthlyTotal) },
          { label: "Terminan en 90 días", value: endingSoon },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-2xl font-semibold tabular-nums leading-none text-[#1c1815]">{s.value}</div>
            <div className="mt-1 text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Dirección, propietario o inquilino…" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" />
        </div>
        {canPickOffice && (
          <select value={office} onChange={(e) => setOffice(e.target.value as Office | "")} aria-label="Oficina" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todas las oficinas</option>
            {Object.entries(officeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar alquileres">
          {([["VIGENTE", "Vigentes"], ["FINALIZADO", "Finalizados"], ["", "Todos"]] as const).map(([value, label]) => (
            <button key={label} onClick={() => { setStatus(value); setEnding(false); }} aria-pressed={!ending && status === value} className={`rounded-full border px-3 py-1 text-xs font-medium ${!ending && status === value ? "border-[#1c1815] bg-[#1c1815] text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              {label}
            </button>
          ))}
          <button onClick={() => setEnding((v) => !v)} aria-pressed={ending} className={`rounded-full border px-3 py-1 text-xs font-medium ${ending ? "border-amber-600 bg-amber-600 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            Terminan pronto
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : leases.length === 0 ? (
        <EmptyState icon={KeyRound} title="No hay alquileres" description="Pulsa «Nuevo alquiler» para dar de alta el primero, eligiendo su vivienda del mapa." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Vivienda</th>
                <th className="px-4 py-3">Propietario</th>
                <th className="px-4 py-3">Inquilino</th>
                <th className="px-4 py-3">Renta</th>
                <th className="px-4 py-3">Contrato</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((l) => {
                const badge = l.status === "VIGENTE" ? endBadge(l.endDate) : null;
                return (
                  <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/alquileres/${l.id}`} className="font-medium text-[#2a241f] hover:underline">{l.dwelling.building.address}</Link>
                      <div className="text-xs text-slate-500">{dwellingTitle(l.dwelling)} · {officeLabels[l.dwelling.building.office]}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{l.owner?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{l.tenant?.name ?? "-"}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{formatCurrency(l.monthlyRent)}/mes</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatDate(l.startDate)} → {l.endDate ? formatDate(l.endDate) : "sin fin"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${l.status === "VIGENTE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{leaseStatusLabels[l.status]}</span>
                      {badge && <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.text}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
