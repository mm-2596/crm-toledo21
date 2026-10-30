import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { LeasesApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "./Toast";
import { dwellingTitle } from "./DwellingPanel";
import { daysUntil, endBadge } from "../lib/leases";
import { formatCurrency, formatDate } from "../lib/format";
import type { Lease } from "../api/types";

const inputClass = "rounded-lg border border-slate-300 px-3 py-1.5 text-sm";

function whenLabel(date: string) {
  const days = daysUntil(date);
  if (days == null) return "";
  if (days < 0) return `Hace ${-days} d`;
  if (days === 0) return "Hoy";
  return `En ${days} d`;
}

/** Contratos vigentes cuya renta toca actualizar (IPC/IGRAF) en los próximos días. */
export function RentReviewList({ days = 60 }: { days?: number }) {
  const { data: due = [] } = useQuery({ queryKey: ["leases", "review", days], queryFn: () => LeasesApi.list({ reviewWithin: days }) });
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-1.5 text-lg font-medium text-[#1c1815]"><TrendingUp size={17} /> Rentas por actualizar</h2>
      <p className="mb-3 text-xs text-slate-500">Contratos cuya renta hay que revisar según el IPC o el IGRAF en los próximos {days} días.</p>
      {due.length === 0 ? (
        <p className="text-sm text-slate-500">Ninguna renta toca actualizarse pronto.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {due.map((l) => (
            <li key={l.id}>
              <Link to={`/alquileres/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-slate-50">
                <span>
                  <span className="font-medium text-[#2a241f]">{l.dwelling.building.address}</span>
                  <span className="ml-2 text-xs text-slate-500">{dwellingTitle(l.dwelling)} · {l.tenant?.name ?? "Sin inquilino"} · {formatCurrency(l.monthlyRent)}/mes</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  Revisión: {formatDate(l.rentReviewDate)}
                  <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700">{whenLabel(l.rentReviewDate as string)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** En la ficha del alquiler: cuándo toca actualizar la renta, registrar la nueva y cambiar la fecha si el contrato fija otra. */
export function RentReviewCard({ lease }: { lease: Lease }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [newRent, setNewRent] = useState("");
  const [date, setDate] = useState(lease.rentReviewDate ?? "");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["lease", lease.id] });
    queryClient.invalidateQueries({ queryKey: ["leases"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["lease-activities", lease.id] });
  };
  const onError = (error: unknown) => showToast(getErrorMessage(error, "No se pudo guardar"), "error");
  const register = useMutation({
    mutationFn: (rent: number) => LeasesApi.registerRentReview(lease.id, rent),
    onSuccess: () => {
      refresh();
      setNewRent("");
      showToast("Renta actualizada");
    },
    onError,
  });
  const changeDate = useMutation({
    mutationFn: (value: string | null) => LeasesApi.setRentReviewDate(lease.id, value),
    onSuccess: (updated) => {
      refresh();
      setDate(updated.rentReviewDate ?? "");
      showToast("Fecha de revisión guardada");
    },
    onError,
  });

  if (lease.status !== "VIGENTE") return null;
  const parsed = Number(newRent.replace(/\./g, "").replace(",", "."));
  const valid = newRent.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-1.5 text-lg font-medium text-[#1c1815]"><TrendingUp size={17} /> Actualización de la renta</h2>
      {lease.rentReviewDate ? (
        <p className="mb-3 text-sm text-slate-700">
          Próxima revisión (IPC/IGRAF): <strong>{formatDate(lease.rentReviewDate)}</strong> <span className="text-slate-400">· {whenLabel(lease.rentReviewDate)}</span>. El aviso aparece en las tareas 30 días antes.
        </p>
      ) : (
        <p className="mb-3 text-sm text-slate-500">Este contrato no tiene una próxima revisión: termina antes del siguiente aniversario.</p>
      )}
      {lease.rentReviewedAt && lease.previousRent != null && (
        <p className="mb-3 text-xs text-slate-500">
          Última actualización ({formatDate(lease.rentReviewedAt)}): {formatCurrency(lease.previousRent)} → {formatCurrency(lease.monthlyRent)} al mes.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-6">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && window.confirm(`¿Registrar la nueva renta de ${formatCurrency(parsed)} al mes?`)) register.mutate(Math.round(parsed));
          }}
        >
          <label className="text-xs text-slate-500">Nueva renta (€/mes)
            <input id="new-rent" value={newRent} onChange={(e) => setNewRent(e.target.value)} inputMode="decimal" placeholder={String(lease.monthlyRent)} className={`${inputClass} mt-1 block w-36`} />
          </label>
          <button type="submit" disabled={!valid || register.isPending || !lease.rentReviewDate} className="rounded-lg bg-[#1c1815] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40">Registrar actualización</button>
        </form>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            changeDate.mutate(date || null);
          }}
        >
          <label className="text-xs text-slate-500">Fecha de revisión
            <input id="review-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} mt-1 block`} />
          </label>
          <button type="submit" disabled={changeDate.isPending} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Guardar fecha</button>
          <button type="button" onClick={() => changeDate.mutate(null)} className="text-xs text-slate-500 hover:underline">Usar el aniversario</button>
        </form>
      </div>
    </div>
  );
}

const PREVIEW = 5;

/** Acceso directo del panel: las rentas por actualizar y los contratos que terminan, con enlace a la ficha de cada uno. */
export function RentalAlertsCard() {
  const { data: reviews = [] } = useQuery({ queryKey: ["leases", "review", 60], queryFn: () => LeasesApi.list({ reviewWithin: 60 }) });
  const { data: endings = [] } = useQuery({ queryKey: ["leases", "ending-home"], queryFn: () => LeasesApi.list({ endingWithin: 90 }) });
  const total = reviews.length + endings.length;

  const Row = ({ lease, right }: { lease: Lease; right: React.ReactNode }) => (
    <li>
      <Link to={`/alquileres/${lease.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm hover:bg-slate-50">
        <span>
          <span className="font-medium text-[#2a241f]">{lease.dwelling.building.address}</span>
          <span className="ml-2 text-xs text-slate-500">{dwellingTitle(lease.dwelling)} · {lease.tenant?.name ?? "Sin inquilino"} · {formatCurrency(lease.monthlyRent)}/mes</span>
        </span>
        <span className="flex items-center gap-2 text-xs text-slate-500">{right}</span>
      </Link>
    </li>
  );

  return (
    <section aria-label="Alertas de alquileres" className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-medium text-[#1c1815]">
          <TrendingUp size={18} className={total ? "text-amber-600" : "text-emerald-600"} /> Alertas de alquileres
          {total > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{total}</span>}
        </h2>
        <Link to="/alquileres" className="shrink-0 text-xs font-medium text-slate-500 hover:text-[#1c1815] hover:underline">Ver alquileres</Link>
      </div>
      <div className="grid gap-x-8 border-t border-slate-100 px-5 py-3 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Rentas por actualizar (60 días)</h3>
          {reviews.length === 0 ? (
            <p className="py-2 text-sm text-slate-500">Ninguna renta toca actualizarse pronto.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reviews.slice(0, PREVIEW).map((l) => (
                <Row key={l.id} lease={l} right={<>Revisión: {formatDate(l.rentReviewDate)}<span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700">{whenLabel(l.rentReviewDate as string)}</span></>} />
              ))}
            </ul>
          )}
          {reviews.length > PREVIEW && <Link to="/alquileres" className="text-xs text-slate-500 hover:underline">+{reviews.length - PREVIEW} más en Alquileres</Link>}
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Contratos que terminan (90 días)</h3>
          {endings.length === 0 ? (
            <p className="py-2 text-sm text-slate-500">Ningún contrato termina pronto.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {endings.slice(0, PREVIEW).map((l) => {
                const badge = endBadge(l.endDate);
                return (
                  <Row key={l.id} lease={l} right={<>Fin: {formatDate(l.endDate)}{badge && <span className={`rounded px-2 py-0.5 font-medium ${badge.className}`}>{badge.text}</span>}</>} />
                );
              })}
            </ul>
          )}
          {endings.length > PREVIEW && <Link to="/alquileres" className="text-xs text-slate-500 hover:underline">+{endings.length - PREVIEW} más en Alquileres</Link>}
        </div>
      </div>
    </section>
  );
}
