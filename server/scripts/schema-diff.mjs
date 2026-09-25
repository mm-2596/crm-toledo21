#!/usr/bin/env node
/**
 * Compara el esquema (prisma/schema.prisma) con la base de datos real y enseña
 * el SQL que haría falta, marcando lo que pueda perder datos.
 *
 * Por qué existe: al arrancar, el servicio ejecuta `prisma db push`, que se
 * niega a continuar ante cualquier aviso de "posible pérdida de datos" (p. ej.
 * añadir una restricción UNIQUE). Si eso pasa en producción, el servicio entra
 * en bucle de reinicios y el CRM queda caído. Ejecutar esto ANTES de hacer push
 * evita la sorpresa.
 *
 * Uso (desde server/, con DIRECT_URL en el entorno o en .env):
 *   npm run db:check          Muestra el SQL pendiente y avisa de lo delicado.
 *   npm run db:check -- --apply   Aplica el SQL, pero solo si es puramente aditivo.
 *
 * Es aditivo si solo contiene CREATE TABLE / CREATE TYPE / CREATE INDEX (no
 * único) / ADD COLUMN nullable o con valor por defecto / ADD CONSTRAINT de
 * clave foránea. Cualquier otra cosa se enseña, pero nunca se aplica sola.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

try {
  process.loadEnvFile?.(".env");
} catch {
  // Sin .env: se usa el entorno tal cual.
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DIRECT_URL (o DATABASE_URL) en el entorno.");
  process.exit(1);
}
const apply = process.argv.includes("--apply");

const sql = execFileSync(
  "npx",
  ["prisma", "migrate", "diff", "--from-url", url, "--to-schema-datamodel", process.env.SCHEMA_PATH || "prisma/schema.prisma", "--script"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
).trim();

if (!sql || sql.includes("This is an empty migration")) {
  console.log("✅ La base de datos ya coincide con el esquema. No hay nada que aplicar.");
  process.exit(0);
}

console.log("SQL pendiente:\n");
console.log(sql, "\n");

const statements = sql
  .split(/;\s*(?:\n|$)/)
  .map((s) => s.replace(/--.*$/gm, "").trim())
  .filter(Boolean);

const risks = [];
for (const raw of statements) {
  const s = raw.replace(/\s+/g, " ");
  if (/^DROP\b/i.test(s) || /\bDROP (COLUMN|CONSTRAINT|DEFAULT|NOT NULL)\b/i.test(s)) risks.push(`Borra o relaja algo existente: ${s.slice(0, 110)}`);
  else if (/^ALTER TABLE .* ALTER COLUMN/i.test(s)) risks.push(`Cambia una columna existente: ${s.slice(0, 110)}`);
  else if (/^ALTER TYPE/i.test(s) && /RENAME|DROP/i.test(s)) risks.push(`Modifica un tipo existente: ${s.slice(0, 110)}`);
  else if (/^CREATE UNIQUE INDEX/i.test(s)) risks.push(`Añade una restricción ÚNICA (fallaría con duplicados y bloquea el arranque): ${s.slice(0, 110)}`);
  else if (/^ALTER TABLE .* ADD COLUMN/i.test(s) && /NOT NULL(?! DEFAULT)/i.test(s)) risks.push(`Columna obligatoria sin valor por defecto (falla si la tabla ya tiene filas): ${s.slice(0, 110)}`);
  else if (/^TRUNCATE|^DELETE|^UPDATE/i.test(s)) risks.push(`Toca datos: ${s.slice(0, 110)}`);
}

if (risks.length > 0) {
  console.log("⚠️  Cambios que requieren revisión manual:");
  for (const r of risks) console.log(`   • ${r}`);
  console.log("\nNo se aplica nada automáticamente. Revisa el SQL, y si es correcto aplícalo tú de forma consciente.");
  process.exit(2);
}

console.log("✅ Cambios puramente aditivos: no tocan datos existentes.");
if (!apply) {
  console.log("Ejecuta `npm run db:check -- --apply` para aplicarlos antes de desplegar.");
  process.exit(0);
}

const file = path.join(os.tmpdir(), `schema-diff-${Date.now()}.sql`);
fs.writeFileSync(file, sql);
execFileSync("npx", ["prisma", "db", "execute", "--file", file, "--url", url], { stdio: "inherit" });
fs.unlinkSync(file);
console.log("✅ Aplicado. Ya puedes desplegar sin riesgo de que db push se bloquee.");
