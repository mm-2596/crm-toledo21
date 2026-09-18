import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import { PropertiesApi } from "../api/endpoints";
import { useToast } from "./Toast";
import type { PropertyImage } from "../api/types";

export function PropertyGallery({ propertyId, images }: { propertyId: string; images: PropertyImage[] }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => PropertiesApi.uploadImage(propertyId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      showToast("Foto añadida");
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error - axios error shape
            (err.response?.data?.error as string | undefined)
          : undefined;
      showToast(message || "No se pudo subir la foto", "error");
    },
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => PropertiesApi.removeImage(propertyId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      showToast("Foto eliminada");
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
        <h2 className="text-lg font-medium text-[#1c1815]">Fotos</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={upload.isPending}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          <ImagePlus size={14} />
          {upload.isPending ? "Subiendo…" : "Subir foto"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} />
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-slate-400">
          Sin fotos todavía. Necesarias para poder publicar esta propiedad en cualquier portal o en la web.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => remove.mutate(img.id)}
                disabled={remove.isPending}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Eliminar foto"
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
