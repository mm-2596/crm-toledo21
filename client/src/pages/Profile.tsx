import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ExternalLink } from "lucide-react";
import { UsersApi } from "../api/endpoints";
import { getErrorMessage } from "../api/client";
import { useToast } from "../components/Toast";
import { useAuth } from "../auth/AuthContext";
import { WEBSITE_URL } from "../lib/config";

export function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => UsersApi.get(user!.id),
    enabled: !!user,
  });

  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (data) {
      setJobTitle(data.jobTitle ?? "");
      setBio(data.bio ?? "");
      setPhone(data.phone ?? "");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => UsersApi.updateProfile(user!.id, { jobTitle: jobTitle || null, bio: bio || null, phone: phone || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
      showToast("Perfil guardado");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo guardar el perfil"), "error"),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => UsersApi.uploadPhoto(user!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
      showToast("Foto actualizada");
    },
    onError: (error) => showToast(getErrorMessage(error, "No se pudo subir la foto"), "error"),
  });

  if (!user || isLoading) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#1c1815]">Mi perfil</h1>
      <p className="mb-6 text-sm text-slate-500">
        Esto es lo que verán los visitantes de la web en tu ficha pública del{" "}
        <a
          href={`${WEBSITE_URL}/equipo/${user.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[#1c1815] hover:underline"
        >
          directorio de agentes <ExternalLink size={12} />
        </a>
        .
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="group relative">
            {data?.photoUrl ? (
              <img src={data.photoUrl} alt={data.name} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={photoMutation.isPending}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1815] text-white shadow-sm hover:bg-[#2a241f] disabled:opacity-50"
              title="Cambiar foto"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) photoMutation.mutate(file);
                e.target.value = "";
              }}
            />
          </div>
          <div>
            <p className="font-medium text-[#1c1815]">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cargo / título público</label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ej. Agente senior de ventas"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Teléfono de contacto</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Biografía</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Unas líneas sobre tu experiencia, especialidad o zona de trabajo…"
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="mt-5 w-full rounded-lg bg-[#1c1815] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a241f] disabled:opacity-50"
        >
          {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
