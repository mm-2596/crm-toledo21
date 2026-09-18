import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GripVertical, PlusCircle } from "lucide-react";
import { ContactsApi, PipelineApi, PropertiesApi } from "../api/endpoints";
import { formatCurrency } from "../lib/format";
import { useToast } from "../components/Toast";
import type { Deal } from "../api/types";

const stageAccent = ["border-t-slate-400", "border-t-sky-400", "border-t-amber-400", "border-t-violet-400", "border-t-emerald-400"];

export function Pipeline() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: stages, isLoading } = useQuery({
    queryKey: ["pipeline-stages"],
    queryFn: PipelineApi.stages,
  });

  const { data: contacts } = useQuery({ queryKey: ["contacts", ""], queryFn: () => ContactsApi.list() });
  const { data: properties } = useQuery({ queryKey: ["properties", ""], queryFn: () => PropertiesApi.list() });

  const moveMutation = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      PipelineApi.moveDeal(dealId, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] }),
  });

  const createMutation = useMutation({
    mutationFn: PipelineApi.createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
      setShowForm(false);
      showToast("Oportunidad creada");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      contactId: String(form.get("contactId")),
      propertyId: String(form.get("propertyId") || "") || null,
      stageId: String(form.get("stageId")),
      value: form.get("value") ? Number(form.get("value")) : null,
    });
    e.currentTarget.reset();
  }

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1c1815]">Pipeline de ventas</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f]"
        >
          <PlusCircle size={16} />
          {showForm ? "Cancelar" : "Nueva oportunidad"}
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Arrastra las tarjetas entre columnas a medida que avance cada venta.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <select name="contactId" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Contacto…</option>
            {(contacts ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="propertyId" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Propiedad (opcional)…</option>
            {(properties ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <select name="stageId" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Etapa…</option>
            {(stages ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input name="value" type="number" placeholder="Valor estimado (€)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="col-span-4 rounded-lg bg-[#1c1815] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50"
          >
            Crear oportunidad
          </button>
        </form>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {(stages ?? []).map((stage, i) => (
          <div
            key={stage.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const dealId = e.dataTransfer.getData("text/deal-id");
              if (dealId) moveMutation.mutate({ dealId, stageId: stage.id });
            }}
            className={`w-72 shrink-0 rounded-lg border border-t-[3px] border-slate-200 bg-slate-100/60 p-3 ${stageAccent[i % stageAccent.length]}`}
          >
            <h2 className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
              {stage.name}
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{stage.deals?.length ?? 0}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {(stage.deals ?? []).map((deal: Deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/deal-id", deal.id)}
                  className="group flex cursor-move items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm hover:shadow-md"
                >
                  <GripVertical size={14} className="mt-0.5 shrink-0 text-slate-300 group-hover:text-slate-400" />
                  <div>
                    <div className="font-medium text-[#2a241f]">{deal.contact?.name}</div>
                    {deal.property && <div className="text-xs text-slate-500">{deal.property.title}</div>}
                    {deal.value != null && <div className="mt-1 text-xs font-medium text-[#2a241f]">{formatCurrency(deal.value)}</div>}
                  </div>
                </div>
              ))}
              {(stage.deals ?? []).length === 0 && (
                <p className="px-1 py-2 text-xs text-slate-400">Sin oportunidades en esta etapa.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
