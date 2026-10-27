"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { approxPoint } from "@/lib/mapPoint";
import { formatCurrency } from "@/lib/format";
import type { PublicProperty } from "@/lib/types";

// Mapa de los resultados de la página: un marcador con el precio por propiedad
// que tenga coordenadas. Solo se carga al pulsar el botón, igual que el de la ficha.
export function ListingMap({ properties }: { properties: PublicProperty[] }) {
  const [show, setShow] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const located = properties.filter((p) => p.latitude != null && p.longitude != null);

  useEffect(() => {
    if (!show || !box.current || located.length === 0) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
      const points: [number, number][] = [];
      for (const p of located) {
        const pt = approxPoint(p.id, p.latitude!, p.longitude!);
        points.push(pt);
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:inline-block;transform:translate(-50%,-50%);background:#1c1815;color:#fff;font:600 12px/1 system-ui,sans-serif;padding:6px 9px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #b08d57">${esc(formatCurrency(p.price))}</span>`,
          iconSize: [0, 0],
        });
        const img = p.images[0]?.url;
        L.marker(pt, { icon })
          .addTo(map)
          .bindPopup(
            `<a href="/propiedades/${encodeURIComponent(p.id)}" style="display:block;width:200px;color:inherit;text-decoration:none">` +
              (img ? `<img src="${esc(img)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:6px" />` : "") +
              `<strong style="display:block;font-size:13px;line-height:1.3">${esc(p.title)}</strong>` +
              `<span style="font-size:12px;color:#6b6760">${esc([p.zone, p.city].filter(Boolean).join(", "))}</span>` +
              `<span style="display:block;margin-top:4px;font-size:12px;text-decoration:underline">Ver ficha</span></a>`,
          );
      }
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [show, located]);

  if (located.length === 0) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper-dim">
      {show ? (
        <div ref={box} role="img" aria-label="Mapa con las propiedades de esta página" className="h-80 w-full sm:h-[26rem]" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <MapIcon size={26} className="text-gold" aria-hidden="true" />
          <p className="max-w-md text-sm text-ink-soft">
            Mira dónde están las {located.length} {located.length === 1 ? "propiedad" : "propiedades"} de esta página. El mapa se
            carga desde un servicio externo cuando lo pides.
          </p>
          <button
            type="button"
            onClick={() => setShow(true)}
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition-transform hover:scale-[1.03]"
          >
            Ver en el mapa
          </button>
        </div>
      )}
    </div>
  );
}
