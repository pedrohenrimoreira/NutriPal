import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_DEFAULT_MODEL: z.string().min(1).default("gpt-5"),
  OPENAI_WEB_MODEL: z.string().min(1).default("gpt-5"),
  OPENAI_VISION_MODEL: z.string().min(1).default("gpt-5"),
  OPENAI_TOOL_MODEL: z.string().min(1).default("gpt-5"),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
  OPENAI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  CORS_ORIGINS: z.string().default(
    "http://localhost:8081,http://localhost:8082,http://127.0.0.1:8081,http://127.0.0.1:8082,http://localhost:19006,http://localhost:3000",
  ),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  UPLOAD_DIR: z.string().default("./storage/uploads"),
  SEMANTIC_INDEX_FILE: z.string().default("./storage/semantic-index.json"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  ...parsed,
  hasOpenAiKey: parsed.OPENAI_API_KEY.trim().length > 0,
  corsOrigins: parsed.CORS_ORIGINS
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  uploadDir: path.resolve(process.cwd(), parsed.UPLOAD_DIR),
  semanticIndexFile: path.resolve(process.cwd(), parsed.SEMANTIC_INDEX_FILE),
};
