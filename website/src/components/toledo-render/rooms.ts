/** Editorial points on the approved illustration, not a measured property plan. */
export const ROOMS = [
  {
    id: 'cocina', label: 'Cocina', number: '01',
    x: 17.7, y: 17.2, width: 10.0,
    focusX: 30, focusY: 29,
    title: 'El placer de compartir.',
    description: 'Una cocina abierta, una isla central y espacio para disfrutar de lo cotidiano.',
  },
  {
    id: 'salon', label: 'Salón', number: '02',
    x: 22.1, y: 55.1, width: 9.2,
    focusX: 43, focusY: 48,
    title: 'Aquí empiezan las historias.',
    description: 'Un salón cálido, con texturas naturales y una zona de descanso conectada con el exterior.',
  },
  {
    id: 'dormitorio', label: 'Dormitorio', number: '03',
    x: 83.4, y: 19.5, width: 12.8,
    focusX: 67, focusY: 27,
    title: 'Tu espacio. Tu calma.',
    description: 'Un dormitorio de tonos suaves, madera y luz cálida, pensado como un refugio personal.',
  },
  {
    id: 'terraza', label: 'Terraza', number: '04',
    x: 71.7, y: 73.6, width: 10.7,
    focusX: 58, focusY: 66,
    title: 'Más vida al aire libre.',
    description: 'Una terraza con vegetación y zonas para sentarse, conversar o simplemente parar.',
  },
] as const;

export type RoomId = (typeof ROOMS)[number]['id'];
