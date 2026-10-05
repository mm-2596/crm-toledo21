import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Phone } from "lucide-react";
import { ActivitiesApi, VisitsApi } from "../api/endpoints";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import type { Visit } from "../api/types";

const dayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });
const timeFormat = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA");

function whatFor(v: Visit) {
  if (v.property) return { label: `${v.property.reference} · ${v.property.title}`, to: `/propiedades/${v.property.id}` };
  if (v.dwelling) return { label: v.dwelling.label, to: `/mapa?vivienda=${v.dwelling.id}` };
  return null;
}

/** Agenda de visitas: el día, la hora y el sitio de cada visita con un cliente. */
export function Visits() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [onlyMine, setOnlyMine] = useState(true);
  const { data = [], isLoading } = useQuery({ queryKey: ["visits", onlyMine], queryFn: () => VisitsApi.list(onlyMine) });
  const complete = useMutation({
    mutationFn: ActivitiesApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showToast("Visita marcada como hecha");
    },
  });

  const groups = new Map<string, Visit[]>();
  for (const v of data) groups.set(dayKey(v.dueDate), [...(groups.get(dayKey(v.dueDate)) ?? []), v]);
  const today = dayKey(new Date().toISOString());

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Agenda de visitas</h1>
        <div className="flex overflow-hidden rounded-lg border border-slate-300 text-sm">
          {[
            { value: true, label: "Mis visitas" },
            { value: false, label: "Todas" },
          ].map((option) => (
            <button key={option.label} onClick={() => setOnlyMine(option.value)} className={`px-3 py-1.5 font-medium ${onlyMine === option.value ? "bg-[#1c1815] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Las visitas con clientes, con día, hora y sitio. Se agendan desde «Clientes que buscan esto» en cada inmueble o vivienda.
      </p>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : data.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No hay visitas agendadas" description="Abre un inmueble en venta, mira qué clientes lo buscan y pulsa «Agendar visita»." />
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([key, visits]) => (
            <section key={key}>
              <h2 className="mb-2 text-sm font-semibold text-[#1c1815] first-letter:uppercase">
                {dayFormat.format(new Date(visits[0].dueDate))}
                {key === today && <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium normal-case text-emerald-700">Hoy</span>}
              </h2>
              <ul className="flex flex-col gap-2">
                {visits.map((v) => {
                  const target = whatFor(v);
                  return (
                    <li key={v.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <span className="w-14 shrink-0 text-lg font-semibold tabular-nums text-[#1c1815]">{timeFormat.format(new Date(v.dueDate))}</span>
                      <div className="min-w-0 flex-1 basis-60">
                        <p className="text-sm text-[#2a241f]">
                          {v.contact ? <Link to={`/contactos/${v.contact.id}`} className="font-medium hover:underline">{v.contact.name}</Link> : "Cliente"}
                          {target && <> · <Link to={target.to} className="hover:underline">{target.label}</Link></>}
                        </p>
                        {v.location && (
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={12} /> {v.location}
                          </p>
                        )}
                        {!onlyMine && v.agent && <p className="text-xs text-slate-400">Con {v.agent.name}</p>}
                      </div>
                      {v.contact?.phone && (
                        <a href={`tel:${v.contact.phone}`} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <Phone size={13} /> {v.contact.phone}
                        </a>
                      )}
                      <button onClick={() => complete.mutate(v.id)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Hecha</button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
