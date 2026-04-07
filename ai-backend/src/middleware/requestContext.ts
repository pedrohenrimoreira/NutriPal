import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export function requestContext(req: Request, res: Response, next: NextFunction) {
  req.requestId = req.header("x-client-request-id") || randomUUID();
  res.setHeader("x-request-id", req.requestId);

  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("request.completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}
