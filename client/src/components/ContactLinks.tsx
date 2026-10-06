import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ContactsApi } from "../api/endpoints";
import { dwellingStatusColors, dwellingStatusLabels, formatDateTime } from "../lib/format";

/** Todo lo que une a esta persona con el resto del CRM: sus viviendas, sus alquileres y sus próximas visitas. */
export function ContactLinks({ contactId }: { contactId: string }) {
  const { data } = useQuery({ queryKey: ["contact-links", contactId], queryFn: () => ContactsApi.links(contactId) });
  if (!data || (data.dwellings.length === 0 && data.leases.length === 0 && data.visits.length === 0)) return null;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-medium text-[#1c1815]">Viviendas, alquileres y visitas</h2>
      <div className="grid gap-5 md:grid-cols-3">
        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Viviendas</h3>
          {data.dwellings.length === 0 ? <p className="text-sm text-slate-400">Ninguna.</p> : (
            <ul className="flex flex-col gap-1.5">
              {data.dwellings.map((d) => (
                <li key={d.id}>
                  <Link to={`/mapa?vivienda=${d.id}`} className="flex items-center gap-2 text-sm text-[#2a241f] hover:underline">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dwellingStatusColors[d.status] }} />
                    <span className="min-w-0 flex-1 truncate">{d.label}</span>
                    <span className="shrink-0 text-xs text-slate-400">{dwellingStatusLabels[d.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Alquileres</h3>
          {data.leases.length === 0 ? <p className="text-sm text-slate-400">Ninguno.</p> : (
            <ul className="flex flex-col gap-1.5">
              {data.leases.map((l) => (
                <li key={l.id}>
                  <Link to={`/alquileres/${l.id}`} className="block text-sm text-[#2a241f] hover:underline">
                    {l.label}
                    <span className="block text-xs text-slate-500">
                      {l.role === "PROPIETARIO" ? "Propietario" : "Inquilino"} · {l.monthlyRent.toLocaleString("es-ES")} €/mes · {l.status === "VIGENTE" ? "Vigente" : "Finalizado"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Próximas visitas</h3>
          {data.visits.length === 0 ? <p className="text-sm text-slate-400">Ninguna.</p> : (
            <ul className="flex flex-col gap-1.5">
              {data.visits.map((v) => (
                <li key={v.id} className="text-sm text-[#2a241f]">
                  <Link to={v.property ? `/propiedades/${v.property.id}` : `/mapa?vivienda=${v.dwellingId}`} className="hover:underline">{v.label}</Link>
                  <span className="block text-xs text-slate-500">{formatDateTime(v.dueDate, true)}{v.location ? ` · ${v.location}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
