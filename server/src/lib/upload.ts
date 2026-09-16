import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOADS_ROOT, "properties", String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadPropertyImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      const err = new Error("Formato de imagen no soportado (usa JPG, PNG o WEBP)") as Error & { status: number };
      err.status = 400;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

const videoStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOADS_ROOT, "properties", String(req.params.id), "videos");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export const uploadPropertyVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedVideoTypes.has(file.mimetype)) {
      const err = new Error("Formato de vídeo no soportado (usa MP4, WEBM o MOV)") as Error & { status: number };
      err.status = 400;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

const agentPhotoStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOADS_ROOT, "agents", String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadAgentPhoto = multer({
  storage: agentPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      const err = new Error("Formato de imagen no soportado (usa JPG, PNG o WEBP)") as Error & { status: number };
      err.status = 400;
      cb(err);
      return;
    }
    cb(null, true);
  },
});
