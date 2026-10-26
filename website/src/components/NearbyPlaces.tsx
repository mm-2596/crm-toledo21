import { Bus, GraduationCap, HeartPulse, Pill, ShoppingCart, TrainFront, TreePine, TramFront } from "lucide-react";
import { getNearby, type NearbyCategory, type NearbyPlace } from "@/lib/nearby";

const GROUPS: { title: string; categories: NearbyCategory[] }[] = [
  { title: "Transporte", categories: ["metro", "tren", "bus"] },
  { title: "Servicios", categories: ["super", "farmacia", "colegio", "salud", "parque"] },
];

const ICONS: Record<NearbyCategory, React.ReactNode> = {
  metro: <TramFront size={16} />,
  tren: <TrainFront size={16} />,
  bus: <Bus size={16} />,
  super: <ShoppingCart size={16} />,
  farmacia: <Pill size={16} />,
  colegio: <GraduationCap size={16} />,
  salud: <HeartPulse size={16} />,
  parque: <TreePine size={16} />,
};

const LABELS: Record<NearbyCategory, string> = {
  metro: "Metro y tranvía",
  tren: "Tren",
  bus: "Autobús",
  super: "Supermercados",
  farmacia: "Farmacias",
  colegio: "Colegios",
  salud: "Salud",
  parque: "Parques",
};

function distanceLabel(p: NearbyPlace) {
  return p.meters < 1000 ? `${p.minutes} min a pie · ${p.meters} m` : `${p.minutes} min a pie · ${(p.meters / 1000).toFixed(1)} km`;
}

// Hasta 3 sitios por tipo, del más cercano al más lejano.
export function NearbyPlaces({ places }: { places: NearbyPlace[] }) {
  if (places.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-display text-xl text-ink">Transporte y servicios cercanos</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {GROUPS.map((group) => {
          const sections = group.categories
            .map((cat) => ({ cat, items: places.filter((p) => p.category === cat).slice(0, 3) }))
            .filter((s) => s.items.length > 0);
          if (sections.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">{group.title}</p>
              <div className="mt-3 flex flex-col gap-4">
                {sections.map(({ cat, items }) => (
                  <div key={cat}>
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <span className="text-gold">{ICONS[cat]}</span>
                      {LABELS[cat]}
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-1 pl-6 text-sm text-ink-soft">
                      {items.map((p) => (
                        <li key={`${p.name}-${p.meters}`} className="flex flex-wrap justify-between gap-x-3">
                          <span>{p.name}</span>
                          <span className="tabular-nums">{distanceLabel(p)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-soft/80">
        Distancias aproximadas a pie desde la zona de la vivienda. Datos de © OpenStreetMap.
      </p>
    </div>
  );
}

// Se consulta aparte para que la ficha no espere a este servicio externo:
// si tarda o no responde, la sección simplemente no aparece.
export async function NearbyPlacesLoader({ lat, lon }: { lat: number; lon: number }) {
  const places = await getNearby(lat, lon);
  return <NearbyPlaces places={places} />;
}
