import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { PropertiesApi, ValuationsApi } from "../api/endpoints";
import {
  formatCurrency,
  formatDate,
  listingTypeLabels,
  propertyStatusLabels,
  propertyTypeLabels,
  statusBadgeClasses,
} from "../lib/format";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => PropertiesApi.get(id as string),
    enabled: Boolean(id),
  });

  const { data: valuations } = useQuery({
    queryKey: ["valuations", id],
    queryFn: () => ValuationsApi.forProperty(id as string),
    enabled: Boolean(id),
  });

  const estimate = useMutation({
    mutationFn: () =>
      ValuationsApi.estimate({
        propertyId: id,
        type: property!.type,
        city: property!.city || "",
        zone: property!.zone,
        areaM2: property!.areaM2 || 0,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["valuations", id] }),
  });

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!property) return <p className="text-red-600">Propiedad no encontrada.</p>;

  const canEstimate = Boolean(property.city && property.areaM2);

  return (
    <div>
      <Link to="/propiedades" className="text-sm text-indigo-700 hover:underline">
        ← Volver a propiedades
      </Link>
      <div className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{property.title}</h1>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            Ref. {property.reference} · {propertyTypeLabels[property.type]} · {listingTypeLabels[property.listingType]}
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[property.status]}`}>
              {propertyStatusLabels[property.status]}
            </span>
          </p>
        </div>
        <p className="text-2xl font-semibold text-indigo-700">{formatCurrency(property.price)}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-slate-900">Detalles</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Ciudad</dt>
            <dd>{property.city || "-"}</dd>
            <dt className="text-slate-500">Zona</dt>
            <dd>{property.zone || "-"}</dd>
            <dt className="text-slate-500">Dirección</dt>
            <dd>{property.address || "-"}</dd>
            <dt className="text-slate-500">Superficie</dt>
            <dd>{property.areaM2 ? `${property.areaM2} m²` : "-"}</dd>
            <dt className="text-slate-500">Habitaciones</dt>
            <dd>{property.bedrooms ?? "-"}</dd>
            <dt className="text-slate-500">Baños</dt>
            <dd>{property.bathrooms ?? "-"}</dd>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-lg font-medium text-slate-900">
              <Sparkles size={17} className="text-indigo-600" />
              Valoración automática
            </h2>
            <button
              onClick={() => estimate.mutate()}
              disabled={!canEstimate || estimate.isPending}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {estimate.isPending ? "Calculando…" : "Estimar precio"}
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            Precio orientativo por comparables: usa el €/m² de propiedades similares ya cargadas en el CRM.
          </p>

          {!canEstimate && (
            <p className="text-sm text-slate-400">
              Añade ciudad y superficie (m²) a la propiedad para poder estimar su precio por comparables.
            </p>
          )}

          {estimate.isError && (
            <p className="text-sm text-red-600">
              No hay suficientes propiedades comparables en el CRM todavía para estimar un precio.
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {(valuations ?? []).map((v) => (
              <li key={v.id} className="rounded-md border border-slate-100 px-3 py-2 text-sm">
                <div className="font-medium text-slate-800">{formatCurrency(v.estimatedValue)}</div>
                <div className="text-xs text-slate-500">
                  {v.factors ? `${formatCurrency(v.factors.avgPricePerM2)}/m² · ${v.factors.comparablesCount} comparables` : ""}
                  {" · "}
                  {formatDate(v.createdAt)}
                </div>
              </li>
            ))}
            {(valuations ?? []).length === 0 && <p className="text-sm text-slate-400">Aún no se ha estimado ningún precio.</p>}
          </ul>
        </div>
      </div>

      {property.description && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-slate-900">Descripción</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{property.description}</p>
        </div>
      )}
    </div>
  );
}
