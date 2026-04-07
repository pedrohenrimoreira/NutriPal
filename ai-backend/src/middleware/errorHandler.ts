import type { NextFunction, Request, Response } from "express";
import OpenAI from "openai";
import { AppError, isAppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

function getOpenAiStatus(error: any) {
  return typeof error.status === "number" ? error.status : 502;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found.`));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof OpenAI.APIError) {
    logger.error("openai.request_failed", {
      requestId: req.requestId,
      upstreamRequestId: error.requestID,
      statusCode: error.status,
      error: error.message,
      type: error.type,
    });

    res.status(getOpenAiStatus(error)).json({
      ok: false,
      error: {
        code: "OPENAI_API_ERROR",
        message: error.message,
        requestId: req.requestId,
        upstreamRequestId: error.requestID,
      },
    });
    return;
  }

  if (isAppError(error)) {
    logger.warn("app.request_failed", {
      requestId: req.requestId,
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    });

    res.status(error.statusCode).json({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: req.requestId,
      },
    });
    return;
  }

  logger.error("request.unhandled_error", {
    requestId: req.requestId,
    error,
  });

  res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error.",
      requestId: req.requestId,
    },
  });
}
