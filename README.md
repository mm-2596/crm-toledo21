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

- **Contactos**: alta, búsqueda, ficha con actividad/tareas.
- **Propiedades**: alta, búsqueda, ficha de detalle.
- **Valoración automática**: estima el precio de una propiedad por
  comparables (media de €/m² de propiedades similares ya cargadas en el
  CRM). No requiere ninguna API externa — ver `server/src/routes/valuations.ts`.
- **Pipeline de ventas**: kanban con arrastrar y soltar entre etapas
  (Nuevo lead → Contactado → Visita programada → Negociación → Cerrado).
- **Tareas**: listado de actividades pendientes con fecha límite.

## Pendiente para siguientes fases

- **Automatización de seguimiento (WhatsApp/Email)**: falta elegir
  proveedor (Meta WhatsApp Cloud API / Twilio, y Resend / SendGrid). Las
  variables ya están preparadas en `server/.env.example`.
- **Integración con Houzez/WordPress**: sincronización de propiedades y
  leads vía la REST API de WordPress. Endpoint base ya creado en
  `server/src/routes/integrations.ts` (`/api/integrations/houzez/*`),
  pendiente de implementar cuando se defina el flujo con el sitio real.
- **Proveedor de IA** (Anthropic/OpenAI): para enriquecer la valoración
  automática con factores cualitativos y para redactar mensajes de
  seguimiento. La valoración actual funciona sin IA (método por
  comparables); cuando se elija proveedor, se añade como capa adicional
  sin cambiar el contrato del endpoint `/api/valuations/estimate`.
- **Autenticación**: de momento no hay login; el modelo `User` ya existe
  en el esquema para cuando se añada.

## Notas de despliegue

Este entorno de desarrollo usa una base de datos MySQL gratuita en Clever
Cloud, que no permite crear una "shadow database", por lo que el esquema
se sincroniza con `prisma db push` en lugar de `prisma migrate dev`. Antes
de desplegar a producción con una base de datos que sí tenga permisos
completos, conviene generar migraciones versionadas con
`npx prisma migrate dev --name init`.
