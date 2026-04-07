import { mkdir } from "node:fs/promises";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

async function bootstrap() {
  await mkdir(env.uploadDir, { recursive: true });

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info("server.started", {
      port: env.PORT,
      nodeEnv: env.NODE_ENV,
    });
  });
}

bootstrap().catch((error) => {
  logger.error("server.bootstrap_failed", { error });
  process.exit(1);
});
