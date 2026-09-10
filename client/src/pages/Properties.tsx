import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, PlusCircle } from "lucide-react";
import { PropertiesApi } from "../api/endpoints";
import { formatCurrency, propertyStatusLabels, propertyTypeLabels, statusBadgeClasses } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import type { Property } from "../api/types";

export function Properties() {
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["properties", q],
    queryFn: () => PropertiesApi.list({ q: q || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: PropertiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setShowForm(false);
      showToast("Propiedad guardada");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      reference: String(form.get("reference")),
      title: String(form.get("title")),
      type: String(form.get("type")) as never,
      listingType: String(form.get("listingType")) as never,
      price: Number(form.get("price")),
      city: String(form.get("city") || "") || null,
      zone: String(form.get("zone") || "") || null,
      areaM2: form.get("areaM2") ? Number(form.get("areaM2")) : null,
      bedrooms: form.get("bedrooms") ? Number(form.get("bedrooms")) : null,
    });
    e.currentTarget.reset();
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Propiedades</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <PlusCircle size={16} />
          {showForm ? "Cancelar" : "Nueva propiedad"}
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Cuantos más datos añadas (ciudad, zona, m²), más precisa será la valoración automática de precios.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <input name="reference" required placeholder="Referencia" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="title" required placeholder="Título" className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select name="type" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {Object.entries(propertyTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select name="listingType" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="VENTA">Venta</option>
            <option value="ALQUILER">Alquiler</option>
          </select>
          <input name="price" type="number" required placeholder="Precio (€)" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="city" placeholder="Ciudad" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="zone" placeholder="Zona/Barrio" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="areaM2" type="number" placeholder="m²" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="bedrooms" type="number" placeholder="Habitaciones" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="col-span-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Guardar propiedad
          </button>
        </form>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por título, referencia o ciudad…"
        className="mb-4 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Todavía no hay propiedades"
          description='Pulsa "Nueva propiedad" arriba a la derecha para dar de alta el primer inmueble.'
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((property: Property) => (
            <Link
              key={property.id}
              to={`/propiedades/${property.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md hover:border-indigo-300"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{property.reference}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[property.status]}`}>
                  {propertyStatusLabels[property.status]}
                </span>
              </div>
              <h3 className="font-medium text-slate-900">{property.title}</h3>
              <p className="text-sm text-slate-500">
                {propertyTypeLabels[property.type]} · {property.city || "-"}
              </p>
              <p className="mt-2 text-lg font-semibold text-indigo-700">{formatCurrency(property.price)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
