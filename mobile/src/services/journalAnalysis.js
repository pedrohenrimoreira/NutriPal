import { chat } from "./aiApi";

const LLM_ANALYSIS_PROMPT = [
  "You are a nutrition expert analyzing a Brazilian food journal.",
  "You must estimate the calories and macronutrients for the provided food log entry.",
  "You MUST return ONLY a raw JSON object with no markdown wrappers or formatting.",
  "Use exactly this JSON shape:",
  "{",
  "  \"items\": [{",
  "    \"name\": \"canonical food name\",",
  "    \"calories\": number,",
  "    \"protein_g\": number,",
  "    \"carbs_g\": number,",
  "    \"fat_g\": number",
  "  }],",
  "  \"totals\": {",
  "    \"calories\": number,",
  "    \"protein_g\": number,",
  "    \"carbs_g\": number,",
  "    \"fat_g\": number",
  "  },",
  "  \"sources\": [{",
  "    \"label\": \"source name\" (e.g. 'USDA', 'TACO', 'AI General Knowledge')",
  "  }],",
  "  \"reasoning\": \"brief explanation\"",
  "}",
  "Guidelines:",
  "- Never calculate calories as zero unless it's clearly not food.",
  "- Identify specific sources used for estimating the nutrition (e.g., USDA database, TACO, etc)."
].join("\n");

export async function analyzeJournalText(rawText, previousAnnotations = []) {
  const analyzedText = String(rawText ?? "");
  const lines = analyzedText.split(/\r?\n/).map((line, index) => ({ lineIndex: index, sourceText: line.trim() })).filter((line) => line.sourceText.length > 0);
  const cachedAnnotations = new Map((previousAnnotations ?? []).filter((a) => a?.sourceText).map((a) => [`${a.lineIndex}:${a.sourceText}`, a]));

  const lineAnnotations = await Promise.all(lines.map(async (line) => {
    const cached = cachedAnnotations.get(`${line.lineIndex}:${line.sourceText}`);
    if (cached) {
      return { ...cached, lineIndex: line.lineIndex, sourceText: line.sourceText, isLoading: false, error: cached.error ?? null };
    }

    try {
      const response = await chat({
        systemPrompt: LLM_ANALYSIS_PROMPT,
        messages: [{ role: "user", text: line.sourceText }],
      });

      const output = response?.outputText || "";
      const raw = String(output).replace(/```json|```/gi, "").trim();
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : raw);

      const totals = parsed.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
      
      return {
        lineIndex: line.lineIndex,
        sourceText: line.sourceText,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        totals: {
          calories: Number(totals.calories ?? 0),
          protein_g: Number(totals.protein_g ?? 0),
          carbs_g: Number(totals.carbs_g ?? 0),
          fat_g: Number(totals.fat_g ?? 0),
        },
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        reasoning: parsed.reasoning || "AI Estimativa",
        confidence: "high",
        unresolvedItems: [],
        isLoading: false,
        error: null,
      };
    } catch (err) {
      return {
        lineIndex: line.lineIndex,
        sourceText: line.sourceText,
        items: [],
        totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
        sources: [],
        reasoning: "",
        confidence: "low",
        unresolvedItems: [line.sourceText],
        isLoading: false,
        error: "Erro ao analisar com IA",
      };
    }
  }));

  const overallTotals = lineAnnotations.reduce((acc, line) => ({
    calories: acc.calories + (line.totals?.calories || 0),
    protein_g: acc.protein_g + (line.totals?.protein_g || 0),
    carbs_g: acc.carbs_g + (line.totals?.carbs_g || 0),
    fat_g: acc.fat_g + (line.totals?.fat_g || 0),
  }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  return {
    analyzedText,
    lineAnnotations,
    totals: overallTotals,
  };
}
