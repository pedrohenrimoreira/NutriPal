import { Router } from "express";
import multer from "multer";
import * as aiController from "../controllers/aiController.js";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { isSupportedMimeType } from "../services/storage/fileStore.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES,
  },
  fileFilter(_req, file, callback) {
    if (!isSupportedMimeType(file.mimetype)) {
      callback(new AppError(400, "UNSUPPORTED_FILE_TYPE", `Unsupported file type: ${file.mimetype}`));
      return;
    }

    callback(null, true);
  },
});

export const aiRouter = Router();

aiRouter.get("/health", aiController.getHealth);
aiRouter.post("/chat", aiController.postChat);
aiRouter.post("/web-chat", aiController.postWebChat);
aiRouter.post("/tool-chat", aiController.postToolChat);
aiRouter.post("/embeddings", aiController.postEmbeddings);
aiRouter.post("/vision", upload.single("image"), aiController.postVision);
aiRouter.post("/files", upload.single("file"), aiController.postFiles);
