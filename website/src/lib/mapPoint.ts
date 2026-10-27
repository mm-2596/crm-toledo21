// El mapa nunca señala el portal exacto: cada propiedad se desplaza un poco
// (unos 100 m, siempre igual para la misma propiedad) y se dibuja con un círculo
// o con un marcador de zona.
export function approxPoint(id: string, lat: number, lon: number): [number, number] {
  const seed = [...id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9973, 7);
  return [lat + ((seed % 21) - 10) * 0.00001 * 9, lon + (((seed >> 3) % 21) - 10) * 0.00001 * 12];
}
