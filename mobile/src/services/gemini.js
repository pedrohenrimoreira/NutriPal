/**
 * Gemini AI service layer.
 *
 * Reads EXPO_PUBLIC_GEMINI_API_KEY from env and calls the Gemini REST API
 * for both text and image food analysis.  Falls back to the local estimator
 * when no key is present or when a call fails.
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            temperature: AI_CONFIG.temperature,
            maxOutputTokens: AI_CONFIG.maxOutputTokens,
            responseMimeType: "application/json",
          },
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    return parseGeminiTextResponse(data);
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
    const base64Data = await uriToBase64(imageUri);

    const prompt = `You are a nutrition expert AI. Analyse this food photo and return JSON with this exact shape:
{
  "items": [{ "name": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }],
  "totals": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }
}
Use typical Brazilian portion sizes when quantities are not visible. Return ONLY JSON, no markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            temperature: AI_CONFIG.temperature,
            maxOutputTokens: AI_CONFIG.maxOutputTokens,
            responseMimeType: "application/json",
          },
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Data,
                  },
                },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );
    if (!response.ok) throw new Error(`Gemini Vision error: ${response.status}`);
    const data = await response.json();
    return parseGeminiTextResponse(data);
  } catch (err) {
    console.warn("[Gemini] analyzeImageEntry failed:", err?.message);
    return emptyNutrition();
  }
}

/* ── Prompt builders ─────────────────────────────────────────────────────── */

function buildTextPrompt(rawText) {
  return `Você é um nutricionista brasileiro especializado em análise calórica. Use a tabela TACO como referência primária.

Porções típicas brasileiras (use quando a quantidade não for informada):
- arroz branco cozido: 150g = 207 kcal | pão francês: 50g = 134 kcal | pão de queijo: 40g = 127 kcal
- feijão cozido: 100g = 76 kcal | tapioca: 70g = 144 kcal | cuscuz nordestino: 150g = 218 kcal
- frango grelhado (peito): 130g = 190 kcal | bife grelhado: 120g = 193 kcal | ovo cozido: 50g = 73 kcal
- banana: 90g = 83 kcal | maçã: 130g = 68 kcal | açaí com granola: 300g = 480 kcal
- iogurte natural: 170g = 99 kcal | leite integral: 200ml = 122 kcal | suco de laranja: 240ml = 110 kcal
- vitamina de fruta: 300ml = 195 kcal | café com leite: 200ml = 60 kcal | granola: 30g = 130 kcal
- batata doce cozida: 120g = 105 kcal | mandioca cozida: 120g = 155 kcal | macarrão cozido: 160g = 219 kcal

Regras:
- NUNCA retorne calories: 0 — sempre estime um valor real; se incerto, estime conservadoramente
- Decomponha pratos compostos (ex: "arroz com feijão" → dois itens separados)
- Considere o método de preparo: frito (+30-50% gordura), grelhado (-10% gordura)
- Retorne APENAS JSON puro, sem markdown

Retorne JSON com este formato exato:
{
  "items": [{ "name": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }],
  "totals": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }
}

Entrada do usuário: "${rawText}"`;
}

/* ── Response parsers ────────────────────────────────────────────────────── */

/**
 * Extract nutrition data from a Gemini generateContent response.
 *
 * @param {object} data - raw JSON from the Gemini REST API
 * @returns {object}    - { items, totals } or emptyNutrition() on failure
 */
function parseGeminiTextResponse(data) {
  try {
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return emptyNutrition();

    const stripped = text.replace(/```json\n?|\n?```/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    const cleaned = jsonMatch ? jsonMatch[0] : stripped;
    const parsed = JSON.parse(cleaned);

    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const totals = parsed.totals ?? items.reduce(
      (acc, item) => {
        acc.calories  += item.calories  ?? 0;
        acc.protein_g += item.protein_g ?? 0;
        acc.carbs_g   += item.carbs_g   ?? 0;
        acc.fat_g     += item.fat_g     ?? 0;
        return acc;
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    return { items, totals };
  } catch (err) {
    console.warn("[Gemini] parseGeminiTextResponse failed:", err?.message);
    return emptyNutrition();
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function emptyNutrition() {
  return {
    items: [],
    totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  };
}

/**
 * Convert an image URI to a base64 string.
 * Works with both local (file://) and remote (http/https) URIs.
 *
 * @param {string} uri
 * @returns {Promise<string>} base64-encoded image data (no prefix)
 */
async function uriToBase64(uri) {
  if (uri.startsWith("data:")) {
    return uri.split(",")[1];
  }

  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
