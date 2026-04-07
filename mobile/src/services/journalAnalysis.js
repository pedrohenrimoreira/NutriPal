import { analyzeLineWithOfficialSources } from "./officialNutrition.js";

function emptyTotals() {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

function normalizeTotals(totals) {
  return {
    calories: Number(totals?.calories ?? 0),
    protein_g: Number(totals?.protein_g ?? 0),
    carbs_g: Number(totals?.carbs_g ?? 0),
    fat_g: Number(totals?.fat_g ?? 0),
  };
}

function sumTotals(items) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + Number(item?.calories ?? 0),
      protein_g: acc.protein_g + Number(item?.protein_g ?? 0),
      carbs_g: acc.carbs_g + Number(item?.carbs_g ?? 0),
      fat_g: acc.fat_g + Number(item?.fat_g ?? 0),
    }),
    emptyTotals(),
  );
}

function splitNonEmptyLines(rawText) {
  return String(rawText ?? "")
    .split(/\r?\n/)
    .map((line, index) => ({ lineIndex: index, sourceText: line.trim() }))
    .filter((line) => line.sourceText.length > 0);
}

function buildCachedAnnotationMap(previousAnnotations) {
  return new Map(
    (previousAnnotations ?? [])
      .filter((annotation) => annotation?.sourceText)
      .map((annotation) => [`${annotation.lineIndex}:${annotation.sourceText}`, annotation]),
  );
}

function toAnnotation(line, result) {
  return {
    lineIndex: line.lineIndex,
    sourceText: line.sourceText,
    items: Array.isArray(result?.items) ? result.items : [],
    totals: normalizeTotals(result?.totals),
    reasoning: result?.reasoning ?? "Official source lookup",
    confidence: result?.confidence ?? "medium",
    sources: Array.isArray(result?.sources) ? result.sources : [],
    unresolvedItems: Array.isArray(result?.unresolvedItems) ? result.unresolvedItems : [],
    isLoading: false,
    error: null,
  };
}

export async function analyzeJournalText(rawText, previousAnnotations = []) {
  const analyzedText = String(rawText ?? "");
  const lines = splitNonEmptyLines(analyzedText);
  const cachedAnnotations = buildCachedAnnotationMap(previousAnnotations);

  const lineAnnotations = await Promise.all(lines.map(async (line) => {
    const cached = cachedAnnotations.get(`${line.lineIndex}:${line.sourceText}`);

    if (cached) {
      return {
        ...cached,
        lineIndex: line.lineIndex,
        sourceText: line.sourceText,
        isLoading: false,
        error: cached.error ?? null,
      };
    }

    const result = await analyzeLineWithOfficialSources(line.sourceText);
    return toAnnotation(line, result);
  }));

  return {
    analyzedText,
    lineAnnotations,
    totals: normalizeTotals(sumTotals(lineAnnotations.map((line) => line.totals))),
  };
}
