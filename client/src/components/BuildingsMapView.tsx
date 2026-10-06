import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { dwellingStatusColors } from "../lib/format";
import type { Building } from "../api/types";

const DEFAULT_CENTER: [number, number] = [40.3057, -3.7326];

// Un círculo por edificio: el anillo reparte los colores según el estado de sus
// viviendas y el número del centro es el total de viviendas censadas.
function makeIcon(building: Building, selected: boolean) {
  const total = building.dwellings.length;
  const count = (status: string) => building.dwellings.filter((d) => d.status === status).length;
  let ring = "#94a3b8";
  if (total > 0) {
    let from = 0;
    const stops = (["A_LA_VENTA", "A_ALQUILER", "ALQUILADA", "VENDIDA", "CENSADA"] as const).map((status) => {
      const to = from + (count(status) / total) * 100;
      const stop = `${dwellingStatusColors[status]} ${from}% ${to}%`;
      from = to;
      return stop;
    });
    ring = `conic-gradient(${stops.join(", ")})`;
  }
  const outline = selected ? "outline:3px solid #1c1815;outline-offset:2px;" : "";
  return L.divIcon({
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `<div style="width:38px;height:38px;border-radius:50%;background:${ring};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);${outline}"><div style="width:26px;height:26px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font:600 12px system-ui,sans-serif;color:#1c1815">${total}</div></div>`,
  });
}

interface Props {
  buildings: Building[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Mientras se coloca un edificio nuevo: punto provisional y clic para moverlo. */
  draft: { lat: number; lng: number } | null;
  onPick: ((lat: number, lng: number) => void) | null;
}

export function BuildingsMapView({ buildings, selectedId, onSelect, draft, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const draftRef = useRef<L.CircleMarker | null>(null);
  const fittedRef = useRef("");
  const onSelectRef = useRef(onSelect);
  const onPickRef = useRef(onPick);
  onSelectRef.current = onSelect;
  onPickRef.current = onPick;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => onPickRef.current?.(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    for (const building of buildings) {
      // El nombre lo escribe un usuario: se pasa como texto, nunca como HTML.
      const label = document.createElement("span");
      label.textContent = `${building.name} · ${building.dwellings.length} viviendas`;
      L.marker([building.latitude, building.longitude], { icon: makeIcon(building, building.id === selectedId) })
        .bindTooltip(label)
        .on("click", () => onSelectRef.current(building.id))
        .addTo(layer);
    }
    const signature = buildings.map((b) => b.id).join(",");
    if (!selectedId && signature !== fittedRef.current && buildings.length > 0) {
      fittedRef.current = signature;
      map.fitBounds(L.latLngBounds(buildings.map((b) => [b.latitude, b.longitude] as [number, number])), {
        padding: [50, 50],
        maxZoom: 16,
      });
    }
  }, [buildings, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const selected = buildings.find((b) => b.id === selectedId);
    if (map && selected) map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 17), { duration: 0.6 });
    // Solo al cambiar la selección: no debe recentrar cada vez que se refrescan los datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!draft) {
      draftRef.current?.remove();
      draftRef.current = null;
      return;
    }
    if (!draftRef.current) {
      draftRef.current = L.circleMarker([draft.lat, draft.lng], { radius: 10, color: "#1c1815", weight: 3, fillColor: "#fbbf24", fillOpacity: 0.9 }).addTo(map);
    } else {
      draftRef.current.setLatLng([draft.lat, draft.lng]);
    }
    map.panTo([draft.lat, draft.lng]);
  }, [draft]);

  return <div ref={containerRef} className={`h-full min-h-[420px] w-full rounded-2xl ${onPick ? "cursor-crosshair" : ""}`} />;
}
