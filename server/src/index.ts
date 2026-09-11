import "dotenv/config";
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

app.use(requireAuth);
app.use("/api/contacts", contactsRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/pipeline", pipelineRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/valuations", valuationsRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`CRM Toledo21 API escuchando en http://localhost:${port}`);
});
