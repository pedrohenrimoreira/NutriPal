import OpenAI from "openai";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

let client: OpenAI | null = null;

export function getOpenAI() {
  if (!env.hasOpenAiKey) {
    throw new AppError(
      503,
      "OPENAI_NOT_CONFIGURED",
      "OPENAI_API_KEY is not configured on the AI backend.",
    );
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: env.OPENAI_TIMEOUT_MS,
      maxRetries: env.OPENAI_MAX_RETRIES,
    });
  }

  return client;
}
