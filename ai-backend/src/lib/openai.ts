import OpenAI from "openai";
import { env } from "../config/env.js";

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: env.OPENAI_TIMEOUT_MS,
  maxRetries: env.OPENAI_MAX_RETRIES,
});
