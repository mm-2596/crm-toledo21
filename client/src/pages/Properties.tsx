import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, PlusCircle } from "lucide-react";
import { PropertiesApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { formatCurrency, propertyStatusLabels, propertyTypeLabels, statusBadgeClasses } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { PropertyForm, emptyPropertyForm, toPropertyPayload } from "../components/PropertyForm";
import type { Property } from "../api/types";

export function Properties() {
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPropertyForm);
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
      setForm(emptyPropertyForm);
      showToast("Propiedad guardada");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar la propiedad"), "error"),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createMutation.mutate(toPropertyPayload(form));
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Propiedades</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f]"
        >
          <PlusCircle size={16} />
          {showForm ? "Cancelar" : "Nueva propiedad"}
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Cuantos más datos añadas, mejor funcionará la valoración automática y antes estará lista para publicarse en la web o en portales.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6">
          <PropertyForm value={form} onChange={setForm} />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="mt-3 w-full rounded-lg bg-[#1c1815] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50"
          >
            {createMutation.isPending ? "Guardando…" : "Guardar propiedad"}
          </button>
        </form>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por título, referencia o ciudad…"
        className="mb-4 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md hover:border-slate-300"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{property.reference}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[property.status]}`}>
                  {propertyStatusLabels[property.status]}
                </span>
              </div>
              <h3 className="font-medium text-[#1c1815]">{property.title}</h3>
              <p className="text-sm text-slate-500">
                {propertyTypeLabels[property.type]} · {property.city || "-"}
              </p>
              <p className="mt-2 text-lg font-semibold text-[#2a241f]">{formatCurrency(property.price)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
