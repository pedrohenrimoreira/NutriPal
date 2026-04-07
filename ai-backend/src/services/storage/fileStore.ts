import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { toFile } from "openai/uploads";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { openai } from "../../lib/openai.js";

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/json",
  "text/plain",
  "text/markdown",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isSupportedMimeType(mimeType: string) {
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

export async function persistAndUploadFile(
  file: Express.Multer.File,
  purpose: "user_data" | "assistants" | "batch" | "vision" | "fine-tune",
) {
  if (!file.buffer?.length) {
    throw new AppError(400, "EMPTY_FILE", "Received an empty file payload.");
  }

  if (!isSupportedMimeType(file.mimetype)) {
    throw new AppError(400, "UNSUPPORTED_FILE_TYPE", `Unsupported file type: ${file.mimetype}`);
  }

  await mkdir(env.uploadDir, { recursive: true });

  const extension = path.extname(file.originalname) || "";
  const storedName = `${randomUUID()}${extension}`;
  const storedPath = path.join(env.uploadDir, storedName);

  await writeFile(storedPath, file.buffer);

  const uploadable = await toFile(file.buffer, file.originalname, { type: file.mimetype });
  const uploaded = await openai.files.create({
    file: uploadable,
    purpose,
  });

  return {
    id: uploaded.id,
    purpose: uploaded.purpose,
    bytes: uploaded.bytes,
    filename: uploaded.filename,
    mimeType: file.mimetype,
    localPath: storedPath,
    createdAt: new Date().toISOString(),
  };
}
