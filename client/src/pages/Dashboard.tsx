import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Building2, Kanban, Trophy, CheckSquare, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardApi, LeasesApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { endBadge } from "../lib/leases";
import { formatCurrency, formatDate } from "../lib/format";
import { TodayTasks } from "../components/TodayTasks";
import { BirthdaysCard } from "../components/BirthdaysCard";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-[#1c1815]">{value}</div>
    </div>
  );
}

function SalesDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: DashboardApi.summary,
  });

  if (isLoading) return <p className="text-slate-500">Cargando panel…</p>;
  if (isError || !data) return <p className="text-red-600">No se pudo cargar el panel.</p>;

  const isEmpty = data.contactsCount === 0 && data.propertiesAvailable === 0;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#1c1815]">Panel general</h1>
      <p className="mb-6 text-sm text-slate-500">Resumen de la actividad comercial de Toledo21.</p>

      <TodayTasks />
      <BirthdaysCard />

      {isEmpty && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <Sparkles size={20} className="mt-0.5 shrink-0 text-[#1c1815]" />
          <div className="text-sm text-[#1c1815]/80">
            <span className="font-medium text-[#1c1815]">¡Bienvenido/a al CRM!</span> Empieza dando de alta
            tu primer <Link to="/contactos" className="underline">contacto</Link> y tu primera{" "}
            <Link to="/propiedades" className="underline">propiedad</Link>. Si tienes dudas sobre cómo usar
            cada sección, consulta la <Link to="/ayuda" className="underline">guía rápida</Link>.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Contactos" value={data.contactsCount} icon={Users} accent="bg-slate-50 text-[#1c1815]" />
        <StatCard
          label="Propiedades disponibles"
          value={data.propertiesAvailable}
          icon={Building2}
          accent="bg-sky-50 text-sky-600"
        />
        <StatCard label="Oportunidades abiertas" value={data.openDeals} icon={Kanban} accent="bg-amber-50 text-amber-600" />
        <StatCard label="Cerradas ganadas" value={data.wonDeals} icon={Trophy} accent="bg-emerald-50 text-emerald-600" />
        <StatCard
          label="Tareas pendientes"
          value={data.pendingActivities}
          icon={CheckSquare}
          accent="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-[#1c1815]">Oportunidades por etapa</h2>
        <div className="flex flex-col gap-2">
          {data.dealsByStage.map((stage) => (
            <div key={stage.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
              <span className="text-slate-700">{stage.name}</span>
              <span className="font-medium text-[#1c1815]">{stage._count.deals}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Inicio de Administración: sus tareas de hoy y los contratos que están a punto de terminar. */
function RentalsHome() {
  const { data: ending = [] } = useQuery({ queryKey: ["leases", "ending-home"], queryFn: () => LeasesApi.list({ endingWithin: 90 }) });
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#1c1815]">Panel de alquileres</h1>
      <p className="mb-6 text-sm text-slate-500">Tus tareas de hoy y los contratos que terminan pronto.</p>
      <TodayTasks />
      <BirthdaysCard />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-medium text-[#1c1815]">Contratos que terminan en los próximos 90 días</h2>
        {ending.length === 0 ? (
          <p className="text-sm text-slate-500">Ningún contrato termina pronto.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ending.map((l) => {
              const badge = endBadge(l.endDate);
              return (
                <li key={l.id}>
                  <Link to={`/alquileres/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-slate-50">
                    <span>
                      <span className="font-medium text-[#2a241f]">{l.dwelling.building.address}</span>
                      <span className="ml-2 text-xs text-slate-500">{l.tenant?.name ?? "Sin inquilino"} · {formatCurrency(l.monthlyRent)}/mes</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      Fin: {formatDate(l.endDate)}
                      {badge && <span className={`rounded px-2 py-0.5 font-medium ${badge.className}`}>{badge.text}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  return user?.role === "ADMINISTRACION" ? <RentalsHome /> : <SalesDashboard />;
}
