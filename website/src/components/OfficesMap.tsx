"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { approxPoint } from "@/lib/mapPoint";
import { formatCurrency } from "@/lib/format";
import type { PublicProperty } from "@/lib/types";

export interface MapOffice {
  name: string;
  city: string;
  address: string;
  services: string;
  phone?: string;
  mapsUrl: string;
  lat: number;
  lon: number;
}

type Filter = "ALL" | "VENTA" | "ALQUILER";

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "VENTA", label: "En venta" },
  { key: "ALQUILER", label: "En alquiler" },
];

// Mapa de la página de oficinas: las oficinas y los inmuebles de venta y de alquiler, con filtro. Las
// posiciones de los inmuebles son aproximadas (zona), nunca el portal exacto. Se carga al llegar a él.
export function OfficesMap({ properties, offices }: { properties: PublicProperty[]; offices: MapOffice[] }) {
  const box = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const allBounds = useRef<import("leaflet").LatLngBounds | null>(null);
  const groups = useRef<{ sale?: import("leaflet").LayerGroup; rent?: import("leaflet").LayerGroup }>({});
  const [filter, setFilter] = useState<Filter>("ALL");
  const [visible, setVisible] = useState(false);

  const located = properties.filter((p) => p.latitude != null && p.longitude != null);
  const sale = located.filter((p) => p.listingType === "VENTA");
  const rent = located.filter((p) => p.listingType === "ALQUILER");

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !box.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      const map = L.map(box.current, { scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const pill = (p: PublicProperty, rentPill: boolean) => {
        const price = rentPill ? `${formatCurrency(p.price)}/mes` : formatCurrency(p.price);
        const bg = rentPill ? "#b08d57" : "#1c1815";
        const border = rentPill ? "#fff" : "#b08d57";
        return L.divIcon({
          className: "",
          html: `<span style="display:inline-block;transform:translate(-50%,-50%);background:${bg};color:#fff;font:600 12px/1 system-ui,sans-serif;padding:6px 9px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid ${border}">${esc(price)}</span>`,
          iconSize: [0, 0],
        });
      };
      const popup = (p: PublicProperty) => {
        const img = p.images[0]?.url;
        return (
          `<a href="/propiedades/${encodeURIComponent(p.id)}" style="display:block;width:200px;color:inherit;text-decoration:none">` +
          (img ? `<img src="${esc(img)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:6px" />` : "") +
          `<span style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8a6428">${p.listingType === "VENTA" ? "En venta" : "En alquiler"}</span>` +
          `<strong style="display:block;font-size:13px;line-height:1.3">${esc(p.title)}</strong>` +
          `<span style="font-size:12px;color:#6b6760">${esc([p.zone, p.city].filter(Boolean).join(", "))}</span>` +
          `<span style="display:block;margin-top:4px;font-size:12px;text-decoration:underline">Ver ficha</span></a>`
        );
      };

      const saleGroup = L.layerGroup();
      const rentGroup = L.layerGroup();
      const points: [number, number][] = [];
      for (const p of located) {
        const pt = approxPoint(p.id, p.latitude!, p.longitude!);
        const isRent = p.listingType === "ALQUILER";
        L.marker(pt, { icon: pill(p, isRent) }).bindPopup(popup(p)).addTo(isRent ? rentGroup : saleGroup);
        // Fuera del encuadre inicial lo que cae lejos de Madrid sur (p. ej. Valencia): se llega con el botón.
        points.push(pt);
      }
      groups.current = { sale: saleGroup, rent: rentGroup };
      saleGroup.addTo(map);
      rentGroup.addTo(map);

      for (const o of offices) {
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;background:#fff;border:3px solid #b08d57;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:16px">&#127968;</span>`,
          iconSize: [0, 0],
        });
        L.marker([o.lat, o.lon], { icon, zIndexOffset: 500, title: o.name })
          .addTo(map)
          .bindPopup(
            `<div style="width:210px"><span style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8a6428">${esc(o.services)}</span>` +
              `<strong style="display:block;font-size:13px;line-height:1.3">${esc(o.name)}</strong>` +
              `<span style="font-size:12px;color:#6b6760">${esc(o.address)}</span>` +
              (o.phone ? `<span style="display:block;font-size:12px;margin-top:2px">${esc(o.phone)}</span>` : "") +
              `<a href="${esc(o.mapsUrl)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:6px;font-size:12px;text-decoration:underline">Cómo llegar</a></div>`,
          );
        // Para el encuadre inicial solo cuentan las oficinas de Madrid.
        if (o.lon < -2) points.push([o.lat, o.lon]);
      }

      // Encuadre inicial: las oficinas de Madrid sur y los inmuebles cercanos (los lejanos, p. ej. en Toledo,
      // se alcanzan con "Ver todo"). Siempre queda a mano la vista completa.
      const madridOffices = offices.filter((o) => o.lon < -2).map((o) => [o.lat, o.lon] as [number, number]);
      const cLat = madridOffices.length ? madridOffices.reduce((a, [la]) => a + la, 0) / madridOffices.length : 40.31;
      const cLon = madridOffices.length ? madridOffices.reduce((a, [, lo]) => a + lo, 0) / madridOffices.length : -3.73;
      const near = points.filter(([la, lo]) => Math.abs(la - cLat) < 0.4 && Math.abs(lo - cLon) < 0.5);
      const initial = [...madridOffices, ...near];
      if (initial.length > 0) map.fitBounds(L.latLngBounds(initial), { padding: [50, 50], maxZoom: 14 });
      else map.setView([cLat, cLon], 11);
      allBounds.current = L.latLngBounds([...madridOffices, ...points.filter(([, lo]) => lo < -2)]);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Se monta una sola vez al hacerse visible: los datos no cambian mientras se está en la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    const map = mapRef.current;
    const { sale: s, rent: r } = groups.current;
    if (!map || !s || !r) return;
    const wantSale = filter !== "ALQUILER";
    const wantRent = filter !== "VENTA";
    if (wantSale && !map.hasLayer(s)) s.addTo(map);
    if (!wantSale && map.hasLayer(s)) map.removeLayer(s);
    if (wantRent && !map.hasLayer(r)) r.addTo(map);
    if (!wantRent && map.hasLayer(r)) map.removeLayer(r);
  }, [filter, visible]);

  function fly(lat: number, lon: number, zoom: number) {
    mapRef.current?.flyTo([lat, lon], zoom, { duration: 1.2 });
  }
  const sagunto = offices.find((o) => o.lon > -2);

  return (
    <div ref={wrap}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar el mapa">
          {FILTERS.map((f) => {
            const count = f.key === "ALL" ? located.length : f.key === "VENTA" ? sale.length : rent.length;
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-soft hover:border-ink/40 hover:text-ink"}`}
              >
                {f.label} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-full border-2" style={{ background: "#1c1815", borderColor: "#b08d57" }} /> Venta</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-full border-2" style={{ background: "#b08d57", borderColor: "#fff", boxShadow: "0 0 0 1px #d9d2c3" }} /> Alquiler</span>
          <span className="flex items-center gap-1.5"><span aria-hidden="true">&#127968;</span> Oficinas</span>
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-3xl border border-line bg-paper-dim">
        <div ref={box} role="region" aria-label="Mapa de inmuebles y oficinas" className="h-[26rem] w-full sm:h-[32rem]" />
        {!visible && <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-soft">Cargando el mapa…</div>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
        <p>Las posiciones de los inmuebles son aproximadas; la dirección exacta se facilita al contactar.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => fly(40.31, -3.73, 12)} className="rounded-full border border-line px-3 py-1 hover:border-ink/40 hover:text-ink">Madrid sur</button>
          <button type="button" onClick={() => allBounds.current && mapRef.current?.fitBounds(allBounds.current, { padding: [50, 50], maxZoom: 14 })} className="rounded-full border border-line px-3 py-1 hover:border-ink/40 hover:text-ink">Ver todo</button>
          {sagunto && (
            <button type="button" onClick={() => fly(sagunto.lat, sagunto.lon, 14)} className="rounded-full border border-line px-3 py-1 hover:border-ink/40 hover:text-ink">Puerto de Sagunto</button>
          )}
        </div>
      </div>
    </div>
  );
}
