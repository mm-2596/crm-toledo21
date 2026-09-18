import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FilmIcon, Trash2 } from "lucide-react";
import { PropertiesApi } from "../api/endpoints";
import { useToast } from "./Toast";
import type { PropertyVideo } from "../api/types";

export function PropertyVideos({ propertyId, videos }: { propertyId: string; videos: PropertyVideo[] }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => PropertiesApi.uploadVideo(propertyId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      showToast("Vídeo añadido");
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error - axios error shape
            (err.response?.data?.error as string | undefined)
          : undefined;
      showToast(message || "No se pudo subir el vídeo", "error");
    },
  });

  const remove = useMutation({
    mutationFn: (videoId: string) => PropertiesApi.removeVideo(propertyId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      showToast("Vídeo eliminado");
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Vídeos</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={upload.isPending}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          <FilmIcon size={14} />
          {upload.isPending ? "Subiendo…" : "Subir vídeo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          hidden
          onChange={handleFileChange}
        />
      </div>

      {videos.length === 0 ? (
        <p className="text-sm text-slate-400">
          Sin vídeos todavía. Opcional, pero ayuda a que la propiedad destaque en la web (máx. 150 MB por archivo).
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {videos.map((video) => (
            <div key={video.id} className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
              <video src={video.url} className="h-full w-full object-cover" controls preload="metadata" />
              <button
                onClick={() => remove.mutate(video.id)}
                disabled={remove.isPending}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Eliminar vídeo"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
