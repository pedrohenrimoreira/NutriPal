import { webChat } from "./aiApi";
import { estimateNutritionFromText } from "../utils/nutrition";
import { useSettingsStore } from "../store/settingsStore";
import { analyzeLineWithOfficialSources } from "./officialNutrition";

const JOURNAL_ANALYSIS_PROMPT = [
  "You are a nutrition expert analyzing a Brazilian food journal.",
  "You will receive JSON with a lines array. Each line has lineIndex and sourceText.",
  "Analyze every non-empty line separately and preserve the exact lineIndex and sourceText.",
  "You MUST return ONLY a raw JSON object with no markdown wrappers or extra text.",
  "Use exactly this JSON shape:",
  "{",
  "  \"lineAnnotations\": [{",
  "    \"lineIndex\": number,",
  "    \"sourceText\": \"exact original line text\",",
  "    \"items\": [{",
  "      \"name\": \"canonical food name\",",
  "      \"calories\": number,",
  "      \"protein_g\": number,",
  "      \"carbs_g\": number,",
  "      \"fat_g\": number",
  "    }],",
  "    \"totals\": {",
  "      \"calories\": number,",
  "      \"protein_g\": number,",
  "      \"carbs_g\": number,",
  "      \"fat_g\": number",
  "    },",
  "    \"sources\": [{",
  "      \"label\": \"source name\"",
  "    }],",
  "    \"reasoning\": \"brief explanation\"",
  "  }]",
  "}",
  "Rules:",
  "- Return one annotation object for each input line.",
  "- Never merge two lines into one annotation.",
  "- Never calculate calories as zero unless the line is clearly not food.",
  "- Identify likely sources used for estimation, such as USDA, TACO, or AI General Knowledge.",
  "- If a line is ambiguous, still make the best estimate and explain briefly in reasoning."
].join("\n");

function emptyTotals() {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

function buildLineKey(line) {
  return `${line.lineIndex}:${line.sourceText}`;
}

function extractJsonObject(text) {
  const raw = String(text ?? "").replace(/```json|```/gi, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : raw);
}

function normalizeTotals(rawTotals) {
  const totals = rawTotals ?? {};
  return {
    calories: Number(totals.calories ?? 0),
    protein_g: Number(totals.protein_g ?? 0),
    carbs_g: Number(totals.carbs_g ?? 0),
    fat_g: Number(totals.fat_g ?? 0),
  };
}

function normalizeSources(rawSources) {
  if (!Array.isArray(rawSources)) {
    return [];
  }

  return rawSources
    .map((source) => {
      if (typeof source === "string" && source.trim()) {
        return { label: source.trim() };
      }

      if (source && typeof source === "object") {
        const label = typeof source.label === "string"
          ? source.label.trim()
          : typeof source.title === "string"
            ? source.title.trim()
            : "";

        if (label) {
          return { label };
        }
      }

      return null;
    })
    .filter(Boolean);
}

function createLineError(line, message = "Erro ao analisar com IA") {
  return {
    lineIndex: line.lineIndex,
    sourceText: line.sourceText,
    items: [],
    totals: emptyTotals(),
    sources: [],
    reasoning: "",
    confidence: "low",
    unresolvedItems: [line.sourceText],
    isLoading: false,
    error: message,
  };
}

function createLocalFallbackAnnotation(line, savedMeals = []) {
  const estimate = estimateNutritionFromText(line.sourceText, savedMeals);
  const items = Array.isArray(estimate?.items) ? estimate.items : [];
  const matchedSavedMeal = Boolean(estimate?.matchedSavedMeal);
  const hasConfidentLocalMatch = items.length > 0
    && items.every((item) => Number(item?.confidence ?? 0) >= 0.8);

  return {
    lineIndex: line.lineIndex,
    sourceText: line.sourceText,
    items,
    totals: normalizeTotals(estimate?.totals),
    sources: [{ label: matchedSavedMeal ? "Saved Meal" : hasConfidentLocalMatch ? "Local Library" : "Local Estimate" }],
    reasoning: matchedSavedMeal
      ? "Correspondencia local com refeicao salva."
      : hasConfidentLocalMatch
        ? "Resolvido localmente pela biblioteca nutricional do app."
        : "Estimativa local aplicada porque a IA nao estava disponivel.",
    confidence: matchedSavedMeal || hasConfidentLocalMatch ? "high" : "medium",
    unresolvedItems: [],
    isLoading: false,
    error: null,
    fallbackMode: "local",
  };
}

function createResolvedAnnotation(line, result, mode = "official") {
  return {
    lineIndex: line.lineIndex,
    sourceText: line.sourceText,
    items: Array.isArray(result?.items) ? result.items : [],
    totals: normalizeTotals(result?.totals),
    sources: normalizeSources(result?.sources),
    reasoning: typeof result?.reasoning === "string" ? result.reasoning : "AI Estimativa",
    confidence: typeof result?.confidence === "string" ? result.confidence : "high",
    unresolvedItems: Array.isArray(result?.unresolvedItems) ? result.unresolvedItems : [],
    isLoading: false,
    error: null,
    fallbackMode: mode,
  };
}

function sanitizeAnnotation(rawAnnotation, line) {
  if (!rawAnnotation || typeof rawAnnotation !== "object") {
    return createLineError(line);
  }

  return {
    lineIndex: line.lineIndex,
    sourceText: line.sourceText,
    items: Array.isArray(rawAnnotation.items) ? rawAnnotation.items : [],
    totals: normalizeTotals(rawAnnotation.totals),
    sources: normalizeSources(rawAnnotation.sources),
    reasoning: typeof rawAnnotation.reasoning === "string" ? rawAnnotation.reasoning : "AI Estimativa",
    confidence: "high",
    unresolvedItems: Array.isArray(rawAnnotation.unresolvedItems) ? rawAnnotation.unresolvedItems : [],
    isLoading: false,
    error: null,
  };
}

export async function analyzeJournalText(rawText, previousAnnotations = []) {
  const analyzedText = String(rawText ?? "");
  const savedMeals = useSettingsStore.getState().savedMeals ?? [];
  const lines = analyzedText
    .split(/\r?\n/)
    .map((line, index) => ({ lineIndex: index, sourceText: line.trim() }))
    .filter((line) => line.sourceText.length > 0);

  if (!lines.length) {
    return {
      analyzedText,
      lineAnnotations: [],
      totals: emptyTotals(),
    };
  }

  const cachedAnnotations = new Map(
    (previousAnnotations ?? [])
      .filter((annotation) => annotation?.sourceText)
      .map((annotation) => [buildLineKey(annotation), annotation]),
  );

  const lineAnnotations = [];
  const unresolvedLines = [];

  for (const line of lines) {
    const cached = cachedAnnotations.get(buildLineKey(line));
    if (cached && !cached.error && cached.fallbackMode !== "local") {
      lineAnnotations.push({
        ...cached,
        lineIndex: line.lineIndex,
        sourceText: line.sourceText,
        isLoading: false,
        error: null,
      });
      continue;
    }

    unresolvedLines.push(line);
  }

  if (!unresolvedLines.length) {
    const overallTotals = lineAnnotations.reduce((acc, line) => ({
      calories: acc.calories + (line.totals?.calories || 0),
      protein_g: acc.protein_g + (line.totals?.protein_g || 0),
      carbs_g: acc.carbs_g + (line.totals?.carbs_g || 0),
      fat_g: acc.fat_g + (line.totals?.fat_g || 0),
    }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

    return {
      analyzedText,
      lineAnnotations: lineAnnotations.sort((a, b) => a.lineIndex - b.lineIndex),
      totals: overallTotals,
    };
  }

  try {
    const remoteAnnotations = await Promise.all(unresolvedLines.map(async (line) => {
      try {
        const official = await analyzeLineWithOfficialSources(line.sourceText);
        return createResolvedAnnotation(line, official, "official");
      } catch {
        try {
          const response = await webChat({
            systemPrompt: JOURNAL_ANALYSIS_PROMPT,
            messages: [{
              role: "user",
              text: JSON.stringify({ lines: [line] }, null, 2),
            }],
            useWeb: true,
          });

          const parsed = extractJsonObject(response?.outputText);
          const rawAnnotations = Array.isArray(parsed?.lineAnnotations) ? parsed.lineAnnotations : [];
          const rawAnnotation = rawAnnotations.find((annotation) => Number(annotation?.lineIndex) === line.lineIndex);

          if (rawAnnotation) {
            return sanitizeAnnotation(rawAnnotation, line);
          }
        } catch {}

        return createLocalFallbackAnnotation(line, savedMeals);
      }
    }));

    lineAnnotations.push(...remoteAnnotations);

    if (!lineAnnotations.some((annotation) => !annotation.error)) {
      throw new Error("A resposta da IA para o journal veio invalida.");
    }
  } catch {
    lineAnnotations.push(...unresolvedLines.map((line) => createLocalFallbackAnnotation(line, savedMeals)));
  }

  const overallTotals = lineAnnotations.reduce((acc, line) => ({
    calories: acc.calories + (line.totals?.calories || 0),
    protein_g: acc.protein_g + (line.totals?.protein_g || 0),
    carbs_g: acc.carbs_g + (line.totals?.carbs_g || 0),
    fat_g: acc.fat_g + (line.totals?.fat_g || 0),
  }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  return {
    analyzedText,
    lineAnnotations: lineAnnotations.sort((a, b) => a.lineIndex - b.lineIndex),
    totals: overallTotals,
  };
}
