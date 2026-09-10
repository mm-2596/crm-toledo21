import "dotenv/config";
import cors from "cors";
import express from "express";
import { contactsRouter } from "./routes/contacts.js";
import { propertiesRouter } from "./routes/properties.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { activitiesRouter } from "./routes/activities.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { usersRouter } from "./routes/users.js";
import { valuationsRouter } from "./routes/valuations.js";
import { integrationsRouter } from "./routes/integrations.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/contacts", contactsRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/pipeline", pipelineRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/valuations", valuationsRouter);
app.use("/api/integrations", integrationsRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`CRM Toledo21 API escuchando en http://localhost:${port}`);
});
