import type { Request, Response } from "express";
import { ZodError, z } from "zod";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import {
  ChatRequestSchema,
  EmbeddingsRequestSchema,
  FileUploadRequestSchema,
  ToolChatRequestSchema,
  VisionRequestSchema,
} from "../types/ai.js";
import {
  createChatResponse,
  createToolChatResponse,
  createVisionResponse,
} from "../services/openai/chatService.js";
import { handleEmbeddingsRequest } from "../services/openai/embeddingService.js";
import { persistAndUploadFile } from "../services/storage/fileStore.js";

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(400, "INVALID_PAYLOAD", "Request body validation failed.", error.flatten());
    }
    throw error;
  }
}

function parseJsonField<T>(raw: unknown, fallback: T): T {
  if (raw === undefined || raw === null || raw === "") {
    return fallback;
  }

  if (typeof raw !== "string") {
    return raw as T;
  }

  return JSON.parse(raw) as T;
}

export async function postChat(req: Request, res: Response) {
  const request = parseBody(ChatRequestSchema, req.body);
  const result = await createChatResponse(request);

  res.json({ ok: true, data: result, requestId: req.requestId });
}

export async function postWebChat(req: Request, res: Response) {
  const request = parseBody(ChatRequestSchema, {
    ...req.body,
    useWeb: true,
  });
  const result = await createChatResponse(request);

  res.json({ ok: true, data: result, requestId: req.requestId });
}

export async function postToolChat(req: Request, res: Response) {
  const request = parseBody(ToolChatRequestSchema, req.body);
  const result = await createToolChatResponse(request);

  res.json({ ok: true, data: result, requestId: req.requestId });
}

export async function postVision(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, "IMAGE_REQUIRED", "Attach an image in the image field.");
  }

  const request = parseBody(VisionRequestSchema, {
    ...req.body,
    history: parseJsonField(req.body.history, []),
  });

  const result = await createVisionResponse(request, req.file);

  res.json({ ok: true, data: result, requestId: req.requestId });
}

export async function postEmbeddings(req: Request, res: Response) {
  const request = parseBody(EmbeddingsRequestSchema, req.body);
  const result = await handleEmbeddingsRequest(request);

  res.json({ ok: true, data: result, requestId: req.requestId });
}

export async function postFiles(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, "FILE_REQUIRED", "Attach a file in the file field.");
  }

  const request = parseBody(FileUploadRequestSchema, req.body);
  const result = await persistAndUploadFile(req.file, request.purpose);

  res.status(201).json({ ok: true, data: result, requestId: req.requestId });
}

export function getHealth(_req: Request, res: Response) {
  res.json({
    ok: true,
    data: {
      status: "ok",
      service: "nutripal-ai-backend",
      timestamp: new Date().toISOString(),
    },
  });
}

export function onUploadError(error: unknown, _req: Request, _res: Response, next: (error?: unknown) => void) {
  logger.warn("upload.failed", { error });
  next(error);
}
