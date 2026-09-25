# CRM Toledo21

CRM inmobiliario a medida para toledo21.com, inspirado en las funciones de
[Inmovilla IA Inmobiliaria](https://www.inmovilla.com/ia-inmobiliaria). Gestiona
contactos/leads, propiedades, pipeline de ventas y tareas, con una función de
valoración automática de inmuebles ya integrada.

## Stack

- **server/**: Node.js + TypeScript + Express + Prisma sobre MySQL.
- **client/**: React + Vite + TypeScript + Tailwind CSS + React Query.

## Puesta en marcha

### 1. Base de datos

Necesitas una base de datos MySQL accesible (local o en la nube). Copia
`server/.env.example` a `server/.env` y ajusta `DATABASE_URL`:

```
DATABASE_URL="mysql://usuario:password@host:puerto/nombre_bd"
```

### 2. Backend

```bash
cd server
npm install
npx prisma db push       # crea las tablas a partir de prisma/schema.prisma
npm run prisma:seed      # crea las etapas por defecto del pipeline
npm run dev              # http://localhost:4000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

El frontend hace proxy de `/api` hacia `http://localhost:4000` (ver
`client/vite.config.ts`), así que basta con abrir `http://localhost:5173`.

## Funcionalidad v1

- **Autenticación**: cada trabajador tiene su propia cuenta (email +
  contraseña). El registro requiere un código de invitación de equipo
  (`TEAM_INVITE_CODE` en `.env`) — no es un registro público. El primer
  usuario que se registra se convierte automáticamente en `ADMIN`; el
  resto son `AGENT`. Sesión guardada en una cookie httpOnly — ver
  `server/src/routes/auth.ts`, `server/src/lib/auth.ts` y
  `client/src/auth/`.
- **Contactos**: alta, búsqueda, ficha con actividad/tareas.
- **Propiedades**: alta, búsqueda, ficha de detalle con fotos (subida propia,
  guardadas en `server/uploads/`), planta, ascensor, certificado energético
  y coordenadas — los datos que piden los portales y la web para publicar.
- **Feed de sindicación** (`GET /api/feed/properties.json` y `.xml`,
  protegido con `?token=` = `FEED_ACCESS_TOKEN`): exporta todas las
  propiedades no retiradas, con sus fotos en URL absoluta, en un formato
  propio pensado para alimentar el plugin "Houzez Property Feed" de la web
  y, más adelante, adaptarse al formato de Idealista/Fotocasa sin rehacer
  el resto — ver `server/src/routes/feed.ts`.
- **Valoración automática**: estima el precio de una propiedad por
  comparables (media de €/m² de propiedades similares ya cargadas en el
  CRM). No requiere ninguna API externa — ver `server/src/routes/valuations.ts`.
- **Pipeline de ventas**: kanban con arrastrar y soltar entre etapas
  (Nuevo lead → Contactado → Visita programada → Negociación → Cerrado).
- **Tareas**: listado de actividades pendientes con fecha límite.
- **Equipo** (`/equipo`, solo admins): activar/desactivar empleados, otorgar
  o quitar el rol de administrador, y ver/copiar el código de invitación —
  ver `client/src/pages/Team.tsx` y `server/src/routes/users.ts`.
- **Calificador de leads (IA)**: mini-entrevista guiada en la ficha del
  contacto (zona, operación, presupuesto, habitaciones, financiación) que
  calcula una prioridad y la guarda — ver `client/src/components/LeadQualifier.tsx`.
- **Matching lead-propiedad (IA)**: en cuanto un contacto tiene preferencias
  guardadas, su ficha muestra automáticamente las propiedades disponibles
  que más encajan (mismo tipo, zona, presupuesto y habitaciones mínimas) —
  ver `GET /api/contacts/:id/matches` en `server/src/routes/contacts.ts`.
- **Asistente IA flotante**: chat con comandos en lenguaje natural. Consulta
  ("tareas", "citas de hoy/mañana", "buscar <nombre>", "propiedades en
  <ciudad>", "resumen") y también **crea** contactos y tareas sin cambiar de
  pantalla ("crear contacto <nombre> <teléfono>", "nueva tarea <texto> para
  <nombre> mañana") — ver `client/src/components/AIAssistant.tsx`.
- **Redactor de descripciones (IA)**: genera o mejora la descripción de una
  propiedad a partir de sus datos — ver `client/src/lib/textGenerator.ts`.

Estas funciones están inspiradas en las 3 herramientas de
[Inmovilla IA Inmobiliaria](https://www.inmovilla.com/ia-inmobiliaria)
(calificador de leads por WhatsApp, asistente que consulta y crea datos por
WhatsApp, e IA de Chrome para textos) y, por ahora, funcionan con reglas
dentro del propio CRM (sin conectarse a WhatsApp ni a un proveedor de IA
externo), para que ya sean utilizables por el equipo hoy mismo. Traducir,
resumir y redactar emails con IA real de verdad quedan pendientes de
conectar un proveedor de IA (ver más abajo).

## Diseño

La interfaz sigue los principios de Apple (materiales translúcidos,
feedback instantáneo en cada interacción, animaciones tipo "spring"
interrumpibles, tipografía con tracking ajustado) usando `framer-motion` y
Tailwind — ver `client/src/index.css` y `client/src/components/Layout.tsx`.

## Pendiente para siguientes fases

- **Automatización de seguimiento (WhatsApp/Email real)**: falta elegir
  proveedor (Meta WhatsApp Cloud API / Twilio, y Resend / SendGrid). Las
  variables ya están preparadas en `server/.env.example`. El calificador de
  leads y el asistente ya están listos para conectarse a WhatsApp cuando se
  decida el proveedor, sin cambiar cómo los usa el equipo.
- **Conectar el feed a la web (Houzez)**: instalar el plugin oficial
  "Houzez Property Feed" en WordPress y apuntarlo a
  `https://<dominio-del-CRM>/api/feed/properties.xml?token=...` con una
  frecuencia de importación (p. ej. cada 30 min). Requiere que el CRM esté
  desplegado en una URL pública (ver "Notas de despliegue").
- **Idealista/Fotocasa**: Idealista no ofrece una API pública para leer lo
  que ya está en su panel (no hay sincronización en ambos sentidos), pero
  sí acepta un feed propio (JSON, antes XML) para publicar automáticamente.
  Hay que solicitarlo al gestor de cuenta de Idealista; una vez tengamos su
  formato exacto, se adapta `server/src/routes/feed.ts` sin rehacer el
  resto (ya expone todos los campos que suelen pedir: precio, superficie,
  habitaciones, planta, ascensor, certificado energético, coordenadas y
  fotos).
- **Proveedor de IA** (Anthropic/OpenAI): para traducir y resumir textos,
  redactar emails, enriquecer la valoración con factores cualitativos, y
  dar respuestas más flexibles en el asistente y el calificador. Todo lo
  construido hasta ahora funciona sin IA (métodos por reglas/comparables);
  cuando se elija proveedor, se añaden como capa adicional sin cambiar el
  contrato de los endpoints existentes.
- **Recuperar contraseña**: no implementado todavía (requeriría un
  proveedor de email).

## Notas de despliegue

Este entorno de desarrollo usa una base de datos MySQL gratuita en Clever
Cloud, que no permite crear una "shadow database", por lo que el esquema
se sincroniza con `prisma db push` en lugar de `prisma migrate dev`. Antes
de depender de esto en un uso más serio, conviene generar migraciones
versionadas con `npx prisma migrate dev --name init` (y probablemente subir
de plan la base de datos: el gratuito limita a 5 conexiones simultáneas).

### Despliegue en Railway (servicio único)

El proyecto está preparado para desplegarse como **un solo servicio**: el
backend (Express) sirve también el frontend ya compilado
(`client/dist`), así que no hace falta desplegar dos servicios ni
preocuparse por CORS.

1. En [railway.com](https://railway.com), crea un proyecto nuevo → "Deploy from GitHub repo" → selecciona `mm-2596/crm-toledo21`.
2. Railway detecta el `package.json` de la raíz. El comando de build es
   `npm run build` y el de arranque `npm run start` (ya definidos en
   `package.json`) — normalmente los detecta solo; si no, configúralos así
   en Settings → Build/Deploy.
3. En **Variables**, añade las mismas que hay en `server/.env` (no subir
   ese archivo nunca a git): `DATABASE_URL`, `JWT_SECRET`,
   `TEAM_INVITE_CODE`, `FEED_ACCESS_TOKEN`, `PUBLIC_BASE_URL` (pon aquí la
   URL final, p. ej. `https://crm.toledo21.com`), y `CLIENT_ORIGIN` (la
   misma URL final).
4. En **Settings → Volumes**, añade un volumen persistente montado en
   `/app/server/uploads` — si no, las fotos de las propiedades se
   perderían en cada despliegue.
5. En **Settings → Networking → Custom Domain**, añade `crm.toledo21.com`.
   Railway te dará un valor CNAME; añádelo como registro DNS donde
   gestionéis el dominio `toledo21.com` (fuera de Railway, en vuestro
   proveedor de DNS). Railway emite el certificado SSL solo.
6. Cada `git push` a `main` vuelve a desplegar automáticamente.

## Cambios en la base de datos: comprobar antes de desplegar

Al arrancar, el servicio ejecuta `prisma db push`. Si el cambio de esquema incluye algo que pueda perder datos (por ejemplo, una restricción `@unique` nueva), Prisma se niega a continuar y el servicio entra en bucle de reinicios: **el CRM queda caído**. Por eso, antes de hacer `git push` de un cambio en `server/prisma/schema.prisma`:

```bash
cd server
npm run db:check              # enseña el SQL pendiente y avisa de lo delicado
npm run db:check -- --apply   # lo aplica, solo si es puramente aditivo
```

Si avisa de algo (borrados, restricciones únicas, columnas obligatorias sin valor por defecto), no se aplica solo: hay que revisar el SQL a mano.
