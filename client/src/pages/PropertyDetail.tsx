import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { MapPin, Sparkles, Wand2 } from "lucide-react";
import { PropertiesApi, ValuationsApi } from "../api/endpoints";
import { formatCurrency, formatDate, listingTypeLabels, propertyStatusLabels, propertyTypeLabels, statusBadgeClasses } from "../lib/format";
import { generateDescription, improveDescription } from "../lib/textGenerator";
import { useToast } from "../components/Toast";
import { PropertyGallery } from "../components/PropertyGallery";
import { PropertyForm, emptyPropertyForm, fromProperty, toPropertyPayload } from "../components/PropertyForm";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyPropertyForm);
  const [coords, setCoords] = useState({ latitude: "", longitude: "" });

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => PropertiesApi.get(id as string),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (property) {
      setForm(fromProperty(property));
      setCoords({
        latitude: property.latitude != null ? String(property.latitude) : "",
        longitude: property.longitude != null ? String(property.longitude) : "",
      });
    }
  }, [property?.id]);

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

  const saveForm = useMutation({
    mutationFn: () => PropertiesApi.update(id as string, toPropertyPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", id] });
      showToast("Propiedad actualizada");
    },
    onError: () => showToast("No se pudo guardar", "error"),
  });

  const saveCoords = useMutation({
    mutationFn: () =>
      PropertiesApi.update(id as string, {
        latitude: coords.latitude ? Number(coords.latitude) : null,
        longitude: coords.longitude ? Number(coords.longitude) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", id] });
      showToast("Coordenadas guardadas");
    },
  });

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!property) return <p className="text-red-600">Propiedad no encontrada.</p>;

  const canEstimate = Boolean(property.city && property.areaM2);
  const formChanged = JSON.stringify(form) !== JSON.stringify(fromProperty(property));
  const coordsChanged =
    coords.latitude !== (property.latitude != null ? String(property.latitude) : "") ||
    coords.longitude !== (property.longitude != null ? String(property.longitude) : "");

  return (
    <div>
      <Link to="/propiedades" className="text-sm text-indigo-700 hover:underline">
        ← Volver a propiedades
      </Link>
      <div className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{property.title}</h1>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            Ref. {property.reference} · {propertyTypeLabels[property.type]} · {listingTypeLabels[property.listingType]}
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[property.status]}`}>
              {propertyStatusLabels[property.status]}
            </span>
          </p>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-indigo-700">{formatCurrency(property.price)}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-1.5">
          <Sparkles size={17} className="text-indigo-600" />
          <h2 className="text-lg font-medium text-slate-900">Valoración automática</h2>
          <button
            onClick={() => estimate.mutate()}
            disabled={!canEstimate || estimate.isPending}
            className="ml-auto rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
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
          <p className="text-sm text-red-600">No hay suficientes propiedades comparables en el CRM todavía para estimar un precio.</p>
        )}

        <ul className="flex flex-wrap gap-2">
          {(valuations ?? []).map((v) => (
            <li key={v.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
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

      <div className="mt-6">
        <PropertyGallery propertyId={property.id} images={property.images ?? []} />
      </div>

      <div className="mt-6">
        <PropertyForm value={form} onChange={setForm} hideDescription />
        {formChanged && (
          <button
            onClick={() => saveForm.mutate()}
            disabled={saveForm.isPending}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveForm.isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-1.5">
          <MapPin size={17} className="text-indigo-600" />
          <h2 className="text-lg font-medium text-slate-900">Ubicación exacta (mapa)</h2>
        </div>
        <p className="mb-3 text-xs text-slate-400">Coordenadas para el mapa en portales y en la web.</p>
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Latitud</label>
            <input
              type="number"
              step="any"
              value={coords.latitude}
              onChange={(e) => setCoords({ ...coords, latitude: e.target.value })}
              placeholder="Ej. 39.8628"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Longitud</label>
            <input
              type="number"
              step="any"
              value={coords.longitude}
              onChange={(e) => setCoords({ ...coords, longitude: e.target.value })}
              placeholder="Ej. -4.0273"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
        </div>
        {coordsChanged && (
          <button
            onClick={() => saveCoords.mutate()}
            disabled={saveCoords.isPending}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveCoords.isPending ? "Guardando…" : "Guardar coordenadas"}
          </button>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-lg font-medium text-slate-900">
            <Wand2 size={17} className="text-indigo-600" />
            Redactor de descripciones (IA)
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setForm({ ...form, description: generateDescription(property) })}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
            >
              Generar
            </button>
            <button
              onClick={() => setForm({ ...form, description: improveDescription(form.description) })}
              disabled={!form.description.trim()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40"
            >
              Mejorar redacción
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          Redacta a partir de los datos de la propiedad, o mejora un texto ya escrito. Se guarda con el botón "Guardar cambios" de arriba.
        </p>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={5}
          placeholder="Escribe o genera una descripción para esta propiedad…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        {formChanged && (
          <button
            onClick={() => saveForm.mutate()}
            disabled={saveForm.isPending}
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveForm.isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        )}
      </div>
    </div>
  );
}
