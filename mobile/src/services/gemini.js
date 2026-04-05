/**
 * Gemini AI service layer.
 *
 * Plug your API key into EXPO_PUBLIC_GEMINI_API_KEY and uncomment the real
 * fetch blocks below.  Until then the app uses the local estimator as a
 * drop-in fallback so all UI states (idle → thinking → done) already work.
 */

import { AI_CONFIG, hasGeminiKey } from "../config/ai";

/* ── AI processing states ────────────────────────────────────────────────── */

export const AI_STATE = {
  IDLE:     "idle",
  THINKING: "thinking",
  DONE:     "done",
  ERROR:    "error",
};

/* ── Text food entry analysis ────────────────────────────────────────────── */

/**
 * Analyse a typed food-log entry.
 *
 * @param {string} rawText  - what the user typed, e.g. "pão de queijo + café"
 * @param {function} fallbackFn - local estimator to use when no API key exists
 * @returns {object|null}   - parsed nutrition result
 */
export async function analyzeTextEntry(rawText, fallbackFn) {
  if (!hasGeminiKey()) {
    return fallbackFn ? fallbackFn(rawText) : null;
  }

  try {
    const prompt = buildTextPrompt(rawText);

    /* ── Real Gemini REST call (uncomment when key is configured) ── */
    // const response = await fetch(
    //   `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.geminiApiKey}`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       generationConfig: {
    //         temperature: AI_CONFIG.temperature,
    //         maxOutputTokens: AI_CONFIG.maxOutputTokens,
    //         responseMimeType: "application/json",
    //       },
    //       contents: [{ parts: [{ text: prompt }] }],
    //     }),
    //   }
    // );
    // if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    // const data = await response.json();
    // return parseGeminiTextResponse(data);

    void prompt;
    return fallbackFn ? fallbackFn(rawText) : null;
  } catch (err) {
    console.warn("[Gemini] analyzeTextEntry failed:", err?.message);
    return fallbackFn ? fallbackFn(rawText) : null;
  }
}

/* ── Image food entry analysis ───────────────────────────────────────────── */

/**
 * Analyse a food photo using Gemini Vision.
 *
 * @param {string} imageUri  - local or remote image URI
 * @returns {object}         - parsed nutrition result
 */
export async function analyzeImageEntry(imageUri) {
  if (!hasGeminiKey()) {
    return emptyNutrition();
  }

  try {
    /* ── Real Gemini Vision call (uncomment when key is configured) ── */
    // 1. Convert imageUri to base64
    // 2. Build multipart prompt
    // 3. Call Gemini Pro Vision endpoint
    // 4. Parse and return structured result

    void imageUri;
    return emptyNutrition();
  } catch (err) {
    console.warn("[Gemini] analyzeImageEntry failed:", err?.message);
    return emptyNutrition();
  }
}

/* ── Prompt builders (expand when integrating) ───────────────────────────── */

function buildTextPrompt(rawText) {
  return `You are a nutrition expert AI. The user has typed a food log entry.
Analyse the food items and return JSON with this exact shape:
{
  "items": [{ "name": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }],
  "totals": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }
}
Food entry: "${rawText}"`;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function emptyNutrition() {
  return {
    items: [],
    totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  };
}
