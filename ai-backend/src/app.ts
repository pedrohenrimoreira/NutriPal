import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { AppError } from "./lib/errors.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestContext } from "./middleware/requestContext.js";
import { aiRouter } from "./routes/aiRoutes.js";

export function createApp() {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(403, "CORS_ORIGIN_DENIED", `Origin ${origin} is not allowed by CORS.`));
    },
  }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestContext);

  app.use("/ai", aiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
