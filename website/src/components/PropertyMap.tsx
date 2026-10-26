"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

interface Props {
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  zone?: string | null;
  city?: string | null;
  // true cuando las coordenadas salen de buscar la zona, no de la dirección exacta
  approximate?: boolean;
}

// El mapa solo se carga cuando la persona lo pide: así no se envía ninguna
// petición a un servicio de mapas externo antes de que lo quiera ver.
export function PropertyMap({ title, latitude, longitude, address, zone, city, approximate }: Props) {
  const [show, setShow] = useState(false);
  const hasCoords = latitude != null && longitude != null;
  const place = [address, zone, city].filter(Boolean).join(", ");

  if (!hasCoords) return null;
  const exact = !approximate;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${(longitude! - 0.006).toFixed(5)}%2C${(latitude! - 0.004).toFixed(5)}%2C${(longitude! + 0.006).toFixed(5)}%2C${(latitude! + 0.004).toFixed(5)}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const external = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-ink">Ubicación</h2>
        <p className="text-xs text-ink-soft">{exact ? place || "Zona de la vivienda" : `Zona aproximada: ${place}`}</p>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper-dim">
        {show ? (
          <iframe
            title={`Mapa de ${title}`}
            src={src}
            loading="lazy"
            className="h-72 w-full border-0 sm:h-80"
          />
        ) : (
          <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center sm:h-80">
            <MapPin size={28} className="text-gold" aria-hidden="true" />
            <p className="max-w-sm text-sm text-ink-soft">
              El mapa se carga desde un servicio externo. Púlsalo cuando quieras verlo.
            </p>
            <button
              type="button"
              onClick={() => setShow(true)}
              className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-transform hover:scale-[1.03]"
            >
              Ver mapa
            </button>
          </div>
        )}
      </div>
      <a href={external} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-ink-soft underline hover:text-ink">
        Abrir en el mapa
      </a>
    </div>
  );
}
