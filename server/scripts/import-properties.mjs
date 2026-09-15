#!/usr/bin/env node
/**
 * Importador masivo de propiedades para el CRM Toledo21.
 *
 * Uso:
 *   IMPORT_EMAIL="tu@email.com" IMPORT_PASSWORD="tu-contraseña" \
 *   node scripts/import-properties.mjs <plantilla.csv> <carpeta-de-fotos>
 *
 * Variables de entorno opcionales:
 *   IMPORT_API_URL   URL del CRM (por defecto http://localhost:4000)
 *
 * La plantilla es la de scripts/plantilla-importacion-propiedades.csv.
 * Cada fila necesita una columna "carpeta_fotos" con el nombre de una
 * subcarpeta dentro de <carpeta-de-fotos> que contenga sus imágenes
 * (jpg/jpeg/png/webp). Se suben en orden alfabético del nombre de archivo,
 * así que conviene nombrarlas 01.jpg, 02.jpg, etc.
 *
 * Es seguro volver a ejecutarlo: las filas cuya "referencia" ya exista en
 * el CRM se detectan y se saltan (con aviso), no se duplican.
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const API_URL = process.env.IMPORT_API_URL || "http://localhost:4000";
const EMAIL = process.env.IMPORT_EMAIL;
const PASSWORD = process.env.IMPORT_PASSWORD;

const [, , csvPathArg, photosDirArg] = process.argv;

if (!EMAIL || !PASSWORD) {
  console.error("Faltan IMPORT_EMAIL / IMPORT_PASSWORD como variables de entorno.");
  process.exit(1);
}
if (!csvPathArg || !photosDirArg) {
  console.error("Uso: node scripts/import-properties.mjs <plantilla.csv> <carpeta-de-fotos>");
  process.exit(1);
}

const csvPath = path.resolve(csvPathArg);
const photosDir = path.resolve(photosDirArg);

const TYPE_LABELS = {
  "piso": "PISO",
  "casa": "CASA",
  "chalet": "CHALET",
  "atico": "ATICO",
  "ático": "ATICO",
  "duplex": "DUPLEX",
  "dúplex": "DUPLEX",
  "estudio": "ESTUDIO",
  "local comercial": "LOCAL",
  "local": "LOCAL",
  "oficina": "OFICINA",
  "garaje": "GARAJE",
  "terreno": "TERRENO",
  "nave industrial": "NAVE_INDUSTRIAL",
  "trastero": "TRASTERO",
  "otro": "OTRO",
};

const LISTING_TYPE_LABELS = { "venta": "VENTA", "alquiler": "ALQUILER" };

const CONDITION_LABELS = {
  "nuevo / a estrenar": "NUEVO",
  "nuevo": "NUEVO",
  "a estrenar": "NUEVO",
  "buen estado": "BUEN_ESTADO",
  "a reformar": "A_REFORMAR",
  "reformado": "REFORMADO",
};

const HEATING_LABELS = {
  "sin calefacción": "NINGUNA",
  "sin calefaccion": "NINGUNA",
  "ninguna": "NINGUNA",
  "individual": "INDIVIDUAL",
  "central": "CENTRAL",
};

const ENERGY_LABELS = {
  "a": "A", "b": "B", "c": "C", "d": "D", "e": "E", "f": "F", "g": "G",
  "en trámite": "EN_TRAMITE", "en tramite": "EN_TRAMITE",
  "exento": "EXENTO",
};

function normalize(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

function mapLabel(dict, raw, fieldName, rowRef) {
  const key = normalize(raw);
  if (!key) return null;
  const value = dict[key];
  if (!value) {
    throw new Error(`Valor no reconocido en "${fieldName}": "${raw}" (fila ${rowRef})`);
  }
  return value;
}

function parseBool(raw) {
  const key = normalize(raw);
  if (!key) return null;
  return ["si", "sí", "true", "1", "yes"].includes(key);
}

// Igual que en el formulario del CRM: admite "185.000" o "185,000" como
// miles, y para decimales una coma o un punto seguido de 1-2 dígitos.
function parseSpanishInt(raw) {
  const cleaned = (raw ?? "").toString().trim().replace(/[.,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseSpanishFloat(raw) {
  const trimmed = (raw ?? "").toString().trim();
  if (!trimmed) return null;
  let cleaned;
  if (trimmed.includes(",")) {
    cleaned = trimmed.replace(/\./g, "").replace(",", ".");
  } else {
    const dotCount = (trimmed.match(/\./g) || []).length;
    const digitsAfterLastDot = trimmed.length - trimmed.lastIndexOf(".") - 1;
    const isDecimalDot = dotCount === 1 && digitsAfterLastDot > 0 && digitsAfterLastDot <= 2;
    cleaned = isDecimalDot ? trimmed : trimmed.replace(/\./g, "");
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function rowToPayload(row, rowRef) {
  const reference = (row.referencia || "").trim();
  const title = (row.titulo || "").trim();
  if (!reference) throw new Error(`Falta "referencia" (fila ${rowRef})`);
  if (!title) throw new Error(`Falta "titulo" (fila ${rowRef})`);

  const price = parseSpanishInt(row.precio);
  if (price == null) throw new Error(`Precio inválido: "${row.precio}" (fila ${rowRef})`);

  return {
    reference,
    title,
    type: mapLabel(TYPE_LABELS, row.tipo, "tipo", rowRef) || "PISO",
    listingType: mapLabel(LISTING_TYPE_LABELS, row.operacion, "operacion", rowRef) || "VENTA",
    price,
    city: row.ciudad?.trim() || null,
    zone: row.zona?.trim() || null,
    address: row.direccion?.trim() || null,
    bedrooms: parseSpanishInt(row.habitaciones),
    bathrooms: parseSpanishInt(row.banos),
    areaM2: parseSpanishInt(row.m2_construidos),
    usableAreaM2: parseSpanishInt(row.m2_utiles),
    floor: parseSpanishInt(row.planta),
    hasElevator: parseBool(row.ascensor),
    yearBuilt: parseSpanishInt(row.ano_construccion),
    condition: mapLabel(CONDITION_LABELS, row.estado, "estado", rowRef),
    parkingSpaces: parseSpanishInt(row.plazas_garaje),
    heating: mapLabel(HEATING_LABELS, row.calefaccion, "calefaccion", rowRef),
    hasAirConditioning: parseBool(row.aire_acondicionado),
    hasTerrace: parseBool(row.terraza),
    hasBalcony: parseBool(row.balcon),
    hasGarden: parseBool(row.jardin),
    hasPool: parseBool(row.piscina),
    hasStorageRoom: parseBool(row.trastero),
    isFurnished: parseBool(row.amueblado),
    isExterior: parseBool(row.exterior),
    hoaFees: parseSpanishInt(row.gastos_comunidad),
    energyRating: mapLabel(ENERGY_LABELS, row.certificado_consumo, "certificado_consumo", rowRef),
    energyConsumptionValue: parseSpanishFloat(row.consumo_kwh),
    energyEmissionsRating: mapLabel(ENERGY_LABELS, row.certificado_emisiones, "certificado_emisiones", rowRef),
    energyEmissionsValue: parseSpanishFloat(row.emisiones_kg),
    description: row.descripcion?.trim() || null,
  };
}

async function login() {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`No se pudo iniciar sesión: ${body.error || res.status}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("El login no devolvió cookie de sesión.");
  return setCookie.split(";")[0];
}

async function createProperty(cookie, payload) {
  const res = await fetch(`${API_URL}/api/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const isDuplicate = res.status === 500 && String(body.error || "").includes("Property_reference_key");
    return { ok: false, duplicate: isDuplicate, error: body.error || `HTTP ${res.status}` };
  }
  return { ok: true, property: body };
}

async function uploadImage(cookie, propertyId, filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[ext];
  if (!mime) return { ok: false, error: `Formato no soportado: ${filePath}` };

  const form = new FormData();
  form.append("image", new Blob([buffer], { type: mime }), path.basename(filePath));

  const res = await fetch(`${API_URL}/api/properties/${propertyId}/images`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error || `HTTP ${res.status}` };
  }
  return { ok: true };
}

async function main() {
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true, bom: true });

  console.log(`Leídas ${rows.length} filas de ${csvPath}`);
  console.log(`Iniciando sesión como ${EMAIL}...`);
  const cookie = await login();
  console.log("Sesión iniciada.\n");

  const summary = { creadas: 0, omitidas: 0, errores: 0, fotos: 0, fotosFallidas: 0 };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowRef = i + 2; // +2: cabecera + índice 1-based
    const label = row.referencia || `fila ${rowRef}`;

    let payload;
    try {
      payload = rowToPayload(row, rowRef);
    } catch (err) {
      console.error(`✗ ${label}: ${err.message}`);
      summary.errores++;
      continue;
    }

    const result = await createProperty(cookie, payload);
    if (!result.ok) {
      if (result.duplicate) {
        console.log(`↷ ${label}: ya existe en el CRM, se omite.`);
        summary.omitidas++;
      } else {
        console.error(`✗ ${label}: ${result.error}`);
        summary.errores++;
      }
      continue;
    }

    console.log(`✓ ${label}: creada (${result.property.id})`);
    summary.creadas++;

    const folderName = row.carpeta_fotos?.trim();
    if (folderName) {
      const folderPath = path.join(photosDir, folderName);
      if (!fs.existsSync(folderPath)) {
        console.warn(`  ⚠ Carpeta de fotos no encontrada: ${folderPath}`);
      } else {
        const files = fs
          .readdirSync(folderPath)
          .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
          .sort();
        for (const file of files) {
          const uploadResult = await uploadImage(cookie, result.property.id, path.join(folderPath, file));
          if (uploadResult.ok) {
            summary.fotos++;
          } else {
            console.warn(`  ⚠ Foto ${file} no subida: ${uploadResult.error}`);
            summary.fotosFallidas++;
          }
        }
        console.log(`  → ${files.length} foto(s) subida(s) desde ${folderName}/`);
      }
    }
  }

  console.log("\n--- Resumen ---");
  console.log(`Propiedades creadas:  ${summary.creadas}`);
  console.log(`Ya existían (omitidas): ${summary.omitidas}`);
  console.log(`Filas con error:      ${summary.errores}`);
  console.log(`Fotos subidas:        ${summary.fotos}`);
  console.log(`Fotos fallidas:       ${summary.fotosFallidas}`);
}

main().catch((err) => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
