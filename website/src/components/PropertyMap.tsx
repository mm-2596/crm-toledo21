"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface Props {
  title: string;
  latitude: number;
  longitude: number;
  label: string;
  // radio del círculo en metros; la vivienda queda siempre dentro
  radius?: number;
}

// El mapa solo se carga cuando la persona lo pide: así no se envía ninguna
// petición a un servicio de mapas externo antes de que quiera verlo.
export function PropertyMap({ title, latitude, longitude, label, radius = 350 }: Props) {
  const [show, setShow] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !box.current) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false, zoomControl: true }).setView([latitude, longitude], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const circle = L.circle([latitude, longitude], {
        radius,
        color: "#b08d57",
        weight: 3,
        fillColor: "#b08d57",
        fillOpacity: 0.28,
      }).addTo(map);
      map.fitBounds(circle.getBounds(), { padding: [60, 60] });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [show, latitude, longitude, radius]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-ink">Ubicación</h2>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper-dim">
        {show ? (
          <div ref={box} role="img" aria-label={`Mapa de la zona de ${title}`} className="h-72 w-full sm:h-96" />
        ) : (
          <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center sm:h-96">
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
      <p className="mt-2 text-xs text-ink-soft/80">
        El círculo señala la zona aproximada; la dirección exacta se facilita al contactar.
      </p>
    </div>
  );
}
