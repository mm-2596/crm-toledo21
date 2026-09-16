import type { PublicVideo } from "@/lib/types";

export function PropertyVideos({ videos, title }: { videos: PublicVideo[]; title: string }) {
  if (videos.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-display text-xl text-ink">Vídeo</h2>
      <div className={`mt-4 grid grid-cols-1 gap-4 ${videos.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {videos.map((video) => (
          <video
            key={video.id}
            src={video.url}
            controls
            preload="metadata"
            className="aspect-video w-full rounded-2xl bg-ink object-cover"
          >
            Tu navegador no puede reproducir este vídeo de {title}.
          </video>
        ))}
      </div>
    </div>
  );
}
