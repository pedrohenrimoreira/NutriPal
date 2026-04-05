/**
 * AI configuration layer.
 *
 * Set EXPO_PUBLIC_GEMINI_API_KEY in your .env (or Replit secrets) to enable
 * real Gemini analysis.  Without a key the app falls back to the built-in
 * local nutrition estimator — everything still works.
 */

export const AI_CONFIG = {
  geminiApiKey:
    typeof process !== "undefined"
      ? (process.env?.EXPO_PUBLIC_GEMINI_API_KEY ?? null)
      : null,
  model: "gemini-1.5-flash",
  temperature: 0.2,
  maxOutputTokens: 1024,
};

/** Returns true when a real Gemini key has been configured. */
export function hasGeminiKey() {
  return Boolean(AI_CONFIG.geminiApiKey);
}
