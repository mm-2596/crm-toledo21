import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ShieldCheck, UserX, UserCheck, Star, X } from "lucide-react";
import { UsersApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { formatDate } from "../lib/format";
import { useToast } from "../components/Toast";
import { useAuth } from "../auth/AuthContext";
import type { AgentReview, TeamMember } from "../api/types";

function RoleBadge({ role }: { role: TeamMember["role"] }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        role === "ADMIN" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {role === "ADMIN" ? "Administrador" : "Agente"}
    </span>
  );
}

function InviteCodeCard() {
  const { data } = useQuery({ queryKey: ["invite-code"], queryFn: UsersApi.inviteCode });
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!data?.inviteCode) return;
    await navigator.clipboard.writeText(data.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
      <h2 className="mb-1 text-sm font-semibold text-indigo-900">Código de invitación del equipo</h2>
      <p className="mb-3 text-sm text-indigo-900/70">
        Compártelo con un nuevo empleado para que pueda crear su cuenta en{" "}
        <span className="font-medium">/registro</span>.
      </p>
      <div className="flex items-center gap-2">
        <code className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
          {data?.inviteCode ?? "…"}
        </code>
        <button
          onClick={handleCopy}
          disabled={!data?.inviteCode}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function ReviewModerationCard() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["pending-reviews"], queryFn: UsersApi.pendingReviews });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => UsersApi.approveReview(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
      showToast("Reseña actualizada");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo actualizar la reseña"), "error"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => UsersApi.removeReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-reviews"] });
      showToast("Reseña eliminada");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo eliminar la reseña"), "error"),
  });

  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
      <h2 className="mb-1 text-sm font-semibold text-amber-900">
        Reseñas pendientes de aprobar ({data.length})
      </h2>
      <p className="mb-3 text-sm text-amber-900/70">
        Solo se muestran públicamente en la web una vez las apruebes aquí.
      </p>
      <div className="flex flex-col gap-3">
        {data.map((review: AgentReview & { agent: { id: string; name: string } }) => (
          <div key={review.id} className="rounded-xl border border-amber-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {review.authorName} → <span className="text-slate-500">{review.agent.name}</span>
                </p>
                <div className="mt-0.5 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={13}
                      className={n <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => approveMutation.mutate({ id: review.id, approved: true })}
                  disabled={approveMutation.isPending}
                  title="Aprobar y publicar"
                  className="rounded-lg border border-emerald-200 p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={() => removeMutation.mutate(review.id)}
                  disabled={removeMutation.isPending}
                  title="Rechazar y eliminar"
                  className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
            <p className="mt-1 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Team() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({ queryKey: ["team"], queryFn: UsersApi.list });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: "ADMIN" | "AGENT"; active?: boolean } }) =>
      UsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      showToast("Cambios guardados");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar el cambio"), "error"),
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Equipo</h1>
      <p className="mb-6 text-sm text-slate-500">
        Gestiona quién tiene acceso al CRM y con qué permisos. Solo los administradores ven esta pantalla.
      </p>

      <ReviewModerationCard />
      <InviteCodeCard />

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Alta</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((member: TeamMember) => {
                const isSelf = member.id === currentUser?.id;
                return (
                  <tr key={member.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">
                            {member.name}
                            {isSelf && <span className="ml-1.5 text-xs font-normal text-slate-400">(tú)</span>}
                          </div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          member.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {member.active ? "Activo" : "Desactivado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(member.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: member.id,
                              data: { role: member.role === "ADMIN" ? "AGENT" : "ADMIN" },
                            })
                          }
                          disabled={isSelf || updateMutation.isPending}
                          title={member.role === "ADMIN" ? "Quitar permisos de administrador" : "Hacer administrador"}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-30"
                        >
                          <ShieldCheck size={15} />
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: member.id, data: { active: !member.active } })}
                          disabled={isSelf || updateMutation.isPending}
                          title={member.active ? "Desactivar acceso" : "Reactivar acceso"}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-300 hover:text-red-600 disabled:opacity-30"
                        >
                          {member.active ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
