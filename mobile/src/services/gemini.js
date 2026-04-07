/**
 * Backward-compatible AI service layer.
 *
 * The app used to call Gemini directly from the client. That path is removed.
 * All AI requests now go through the secure backend proxy.
 */

import { chat, vision } from "./aiApi";

export const AI_STATE = {
  IDLE: "idle",
  THINKING: "thinking",
  DONE: "done",
  ERROR: "error",
};

const TEXT_SYSTEM_PROMPT = [
  "You are a nutrition expert for a Brazilian food journal.",
  "Return only valid JSON.",
  "Use this exact shape:",
  "{\"items\":[{\"name\":string,\"calories\":number,\"protein_g\":number,\"carbs_g\":number,\"fat_g\":number}],\"totals\":{\"calories\":number,\"protein_g\":number,\"carbs_g\":number,\"fat_g\":number}}",
  "Decompose combined meals into separate items.",
  "Never return calories as zero unless the image is clearly empty.",
].join("\n");

const VISION_SYSTEM_PROMPT = [
  "You analyze food photos for a nutrition journal.",
  "Return only valid JSON.",
  "Use this exact shape:",
  "{\"items\":[{\"name\":string,\"calories\":number,\"protein_g\":number,\"carbs_g\":number,\"fat_g\":number}],\"totals\":{\"calories\":number,\"protein_g\":number,\"carbs_g\":number,\"fat_g\":number}}",
  "If the portion is uncertain, estimate conservatively.",
].join("\n");

export async function analyzeTextEntry(rawText, fallbackFn) {
  try {
    const response = await chat({
      systemPrompt: TEXT_SYSTEM_PROMPT,
      messages: [{ role: "user", text: String(rawText ?? "").trim() }],
    });

    return parseStructuredNutritionText(response.outputText);
  } catch (error) {
    console.warn("[AI] analyzeTextEntry failed:", error?.message);
    return fallbackFn ? fallbackFn(rawText) : null;
  }
}

export async function analyzeImageEntry(imageUri) {
  try {
    const response = await vision({
      input: "Analyze this food photo and estimate nutrition. Return only JSON.",
      systemPrompt: VISION_SYSTEM_PROMPT,
      image: {
        uri: imageUri,
        name: inferFileName(imageUri),
        type: inferImageMimeType(imageUri),
      },
    });

    return parseStructuredNutritionText(response.outputText);
  } catch (error) {
    console.warn("[AI] analyzeImageEntry failed:", error?.message);
    return emptyNutrition();
  }
}

function inferFileName(uri) {
  const parts = String(uri ?? "").split("/").filter(Boolean);
  return parts[parts.length - 1] || "image.jpg";
}

function inferImageMimeType(uri) {
  const value = String(uri ?? "").toLowerCase();
  if (value.endsWith(".png")) return "image/png";
  if (value.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function parseStructuredNutritionText(text) {
  try {
    const raw = String(text ?? "").replace(/```json|```/gi, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);

    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const totals = parsed.totals ?? items.reduce(
      (acc, item) => {
        acc.calories += Number(item?.calories ?? 0);
        acc.protein_g += Number(item?.protein_g ?? 0);
        acc.carbs_g += Number(item?.carbs_g ?? 0);
        acc.fat_g += Number(item?.fat_g ?? 0);
        return acc;
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    );

    return { items, totals };
  } catch (error) {
    console.warn("[AI] parseStructuredNutritionText failed:", error?.message);
    return emptyNutrition();
  }
}

function emptyNutrition() {
  return {
    items: [],
    totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  };
}
