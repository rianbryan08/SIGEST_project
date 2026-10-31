import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";
import { AppError } from "./errorHandler";

// Pasta onde as capturas de tela ficam salvas (backend/uploads).
export const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

// Só imagens. A extensão do arquivo salvo vem do tipo validado, nunca do nome enviado.
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomUUID()}${EXTENSION_BY_MIME[file.mimetype]}`),
});

export const uploadScreenshot = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!EXTENSION_BY_MIME[file.mimetype]) {
      return cb(new AppError("Envie apenas imagens (PNG, JPG, WEBP ou GIF).", 400));
    }
    cb(null, true);
  },
}).single("screenshot");
