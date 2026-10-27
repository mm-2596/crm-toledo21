import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, Phone, Search, Target } from "lucide-react";
import { ActivitiesApi, ProspectionsApi, UsersApi } from "../api/endpoints";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { useAuth } from "../auth/AuthContext";
import { formatDate, formatDateTime, officeLabels, prospectStatusLabels, sellInterestLabels } from "../lib/format";
import { formatUnit } from "../lib/prospectNote";
import type { ProspectStatus, SellInterest } from "../api/types";

const STATE_CHIP: Record<string, string> = {
  overdue: "bg-red-50 text-red-700",
  soon: "bg-amber-50 text-amber-700",
  today: "bg-emerald-50 text-emerald-700",
  upcoming: "bg-slate-100 text-slate-500",
};
const STATE_LABEL: Record<string, string> = { overdue: "Atrasada", soon: "Ahora", today: "Hoy", upcoming: "Próxima" };
const STATUS_CHIP: Record<string, string> = {
  EN_SEGUIMIENTO: "bg-amber-50 text-amber-800",
  CAPTADO: "bg-emerald-50 text-emerald-800",
  DESCARTADO: "bg-slate-100 text-slate-500",
};
const INTEREST_CHIP: Record<string, string> = {
  CORTO: "bg-emerald-50 text-emerald-800",
  MEDIO: "bg-sky-50 text-sky-800",
  LARGO: "bg-slate-100 text-slate-700",
  NO_INTERESADO: "bg-red-50 text-red-700",
};

/** Prospección: las llamadas de seguimiento pendientes y todos los pisos que se están trabajando. */
export function Prospections() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [who, setWho] = useState<"mine" | "all">("mine");
  const [status, setStatus] = useState<ProspectStatus | "">("EN_SEGUIMIENTO");
  const [interest, setInterest] = useState<SellInterest | "">("");
  const [agentId, setAgentId] = useState("");
  const [q, setQ] = useState("");

  const calls = useQuery({ queryKey: ["prospect-calls", who], queryFn: () => ProspectionsApi.calls({ all: who === "all" }), refetchInterval: 60_000 });
  const list = useQuery({
    queryKey: ["prospections", status, interest, agentId, q],
    queryFn: () => ProspectionsApi.list({ status: status || undefined, interest: interest || undefined, agentId: agentId || undefined, q: q || undefined }),
    placeholderData: (previous) => previous,
  });
  const { data: people = [] } = useQuery({ queryKey: ["assignable-users"], queryFn: UsersApi.assignable });

  const done = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-calls"] });
      queryClient.invalidateQueries({ queryKey: ["prospections"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showToast("Llamada marcada como hecha");
    },
    onError: () => showToast("No se pudo marcar", "error"),
  });

  const due = (calls.data ?? []).filter((c) => c.state !== "upcoming");
  const upcoming = (calls.data ?? []).filter((c) => c.state === "upcoming");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Prospección</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">
        Los pisos que todavía no tenemos y estamos intentando captar, y las llamadas para volver a hablar con sus propietarios. Cuando se consigue la nota de encargo, el piso pasa a «A la venta».
      </p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-medium text-[#1c1815]"><Phone size={16} /> Llamadas pendientes</h2>
          {isAdmin && (
            <div className="flex gap-1 rounded-lg border border-slate-200 p-0.5 text-xs">
              {(["mine", "all"] as const).map((v) => (
                <button key={v} onClick={() => setWho(v)} className={`rounded-md px-3 py-1 ${who === v ? "bg-[#1c1815] text-white" : "text-slate-600"}`}>{v === "mine" ? "Las mías" : "De todo el equipo"}</button>
              ))}
            </div>
          )}
        </div>
        {calls.isLoading ? (
          <p className="mt-3 text-sm text-slate-500">Cargando…</p>
        ) : due.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No hay llamadas pendientes para hoy. 🎉</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {due.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATE_CHIP[c.state]}`}>{STATE_LABEL[c.state]}</span>
                <div className="min-w-0 flex-1 basis-60">
                  {c.dwelling ? <Link to={`/mapa?vivienda=${c.dwelling.id}`} className="hover:underline">{c.description}</Link> : c.description}
                  <div className="text-xs text-slate-500">
                    {formatDateTime(c.dueDate, c.hasTime)}
                    {c.dwelling?.owner && ` · ${c.dwelling.owner}`}
                    {c.dwelling?.phone && ` · ${c.dwelling.phone}`}
                    {who === "all" && c.agent && ` · ${c.agent.name}`}
                  </div>
                </div>
                <button onClick={() => done.mutate(c.id)} className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"><Check size={13} /> Hecha</button>
              </li>
            ))}
          </ul>
        )}
        {upcoming.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-xs text-slate-500">Próximas llamadas ({upcoming.length})</summary>
            <ul className="mt-1 divide-y divide-slate-100">
              {upcoming.map((c) => (
                <li key={c.id} className="py-2 text-xs text-slate-600">
                  {c.dwelling ? <Link to={`/mapa?vivienda=${c.dwelling.id}`} className="hover:underline">{c.description}</Link> : c.description}
                  <span className="text-slate-400"> · {formatDate(c.dueDate)}{who === "all" && c.agent ? ` · ${c.agent.name}` : ""}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-base font-medium text-[#1c1815]">Pisos en prospección</h2>
          <label className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar edificio, persona o nota…" aria-label="Buscar" className="w-60 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm" />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ProspectStatus | "")} aria-label="Estado" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todos los estados</option>
            {Object.entries(prospectStatusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={interest} onChange={(e) => setInterest(e.target.value as SellInterest | "")} aria-label="Interés en vender" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Cualquier interés</option>
            {Object.entries(sellInterestLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {isAdmin && (
            <select value={agentId} onChange={(e) => setAgentId(e.target.value)} aria-label="Comercial" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Todos los comerciales</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        {list.isLoading ? (
          <p className="text-slate-500">Cargando…</p>
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState icon={Target} title="Aún no hay pisos en prospección" description="Abre un edificio en el Mapa, entra en un piso y escribe lo que hables con el propietario, o díselo al asistente: «He hablado con Paca del 3ºB de Calle Mayor 5, que la llame en un mes»." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Piso</th>
                  <th className="px-4 py-3 font-medium">Propietario</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Interés</th>
                  <th className="px-4 py-3 font-medium">Comercial</th>
                  <th className="px-4 py-3 font-medium">Última conversación</th>
                  <th className="px-4 py-3 font-medium">Próxima llamada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.data!.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link to={`/mapa?vivienda=${p.id}`} className="font-medium text-[#1c1815] hover:underline">{formatUnit(p.floor, p.door) || "Piso"}</Link>
                      <div className="text-xs text-slate-500">{p.building.address}{p.building.city ? `, ${p.building.city}` : ""} · {officeLabels[p.building.office]}</div>
                    </td>
                    <td className="px-4 py-3">{p.owner ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CHIP[p.prospectStatus]}`}>{prospectStatusLabels[p.prospectStatus]}</span></td>
                    <td className="px-4 py-3">{p.sellInterest ? <span className={`rounded px-2 py-0.5 text-xs font-medium ${INTEREST_CHIP[p.sellInterest]}`}>{sellInterestLabels[p.sellInterest]}</span> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3">{p.agent?.name ?? <span className="text-slate-400">Sin asignar</span>}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                      {p.lastNote ? (<><span className="text-slate-400">{formatDate(p.lastNote.createdAt)}{p.lastNote.agent ? ` · ${p.lastNote.agent}` : ""}</span><br />{p.lastNote.description.length > 110 ? `${p.lastNote.description.slice(0, 110)}…` : p.lastNote.description}</>) : <span className="text-slate-400">Sin conversaciones</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.nextCall ? <span className={`rounded px-1.5 py-0.5 font-medium ${STATE_CHIP[p.nextCall.state]}`}>{formatDate(p.nextCall.dueDate)}</span> : <span className="text-slate-400">Sin llamada</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
