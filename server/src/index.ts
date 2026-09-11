import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { contactsRouter } from "./routes/contacts.js";
import { propertiesRouter } from "./routes/properties.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { activitiesRouter } from "./routes/activities.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { usersRouter } from "./routes/users.js";
import { valuationsRouter } from "./routes/valuations.js";
import { feedRouter } from "./routes/feed.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requireAuth } from "./lib/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);

// Publicos (sin sesion): el feed de sindicacion y las fotos de propiedades,
// pensados para que un importador externo (plugin de la web, portal) los lea.
app.use("/api/feed", feedRouter);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// A partir de aqui, cada router de la API va explicitamente protegido con
// requireAuth (en vez de un app.use(requireAuth) global) para que no se
// "arrastre" por error a rutas registradas despues, como el frontend.
app.use("/api/contacts", requireAuth, contactsRouter);
app.use("/api/properties", requireAuth, propertiesRouter);
app.use("/api/pipeline", requireAuth, pipelineRouter);
app.use("/api/activities", requireAuth, activitiesRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/users", requireAuth, usersRouter);
app.use("/api/valuations", requireAuth, valuationsRouter);

// Cualquier /api/* que no haya coincidido con nada anterior es un 404 real.
app.use("/api", notFound);

// En produccion, este mismo servicio sirve tambien el frontend ya compilado
// (client/dist), para desplegar como un unico servicio en Railway.
const clientDist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`CRM Toledo21 API escuchando en http://localhost:${port}`);
});
