import { AI_CONFIG } from "../config/ai.js";
import { chat } from "./aiApi";

const TBCA_SEARCH_URL = "https://www.tbca.net.br/base-dados/composicao_alimentos.php";
const TBCA_BASE_URL = "https://www.tbca.net.br/base-dados/";
const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_WEB_URL = "https://fdc.nal.usda.gov/fdc-app.html#/food-details/";
const USDA_DEMO_KEY = "DEMO_KEY";
const REQUEST_TIMEOUT_MS = 15000;

const STOPWORDS = new Set([
  "a", "ao", "aos", "as", "ate", "c", "ca", "com", "da", "das", "de", "do", "dos", "e",
  "em", "na", "nas", "no", "nos", "o", "os", "ou", "para", "por", "pra", "sem", "um",
  "uma", "uns", "umas",
]);

const RESULT_AVOID_TOKENS = [
  "sanduiche",
  "hamburguer",
  "pizza",
  "bolo",
  "wafer",
  "biscoito",
  "sorvete",
  "molho",
  "patê",
];

const COMMON_ENTITY_MAP = {
  "&amp;": "&",
  "&apos;": "'",
  "&quot;": "\"",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&aacute;": "a",
  "&agrave;": "a",
  "&acirc;": "a",
  "&atilde;": "a",
  "&auml;": "a",
  "&ccedil;": "c",
  "&eacute;": "e",
  "&ecirc;": "e",
  "&euml;": "e",
  "&iacute;": "i",
  "&icirc;": "i",
  "&iuml;": "i",
  "&ntilde;": "n",
  "&oacute;": "o",
  "&ograve;": "o",
  "&ocirc;": "o",
  "&otilde;": "o",
  "&ouml;": "o",
  "&uacute;": "u",
  "&ucirc;": "u",
  "&uuml;": "u",
  "&Aacute;": "A",
  "&Acirc;": "A",
  "&Atilde;": "A",
  "&Ccedil;": "C",
  "&Eacute;": "E",
  "&Ecirc;": "E",
  "&Iacute;": "I",
  "&Oacute;": "O",
  "&Ocirc;": "O",
  "&Otilde;": "O",
  "&Uacute;": "U",
};

const tbcaSearchCache = new Map();
const tbcaDetailCache = new Map();
const usdaSearchCache = new Map();

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function emptyTotals() {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

function sumTotals(items) {
  return items.reduce(
    (acc, item) => ({
      calories: round1(acc.calories + Number(item?.calories ?? 0)),
      protein_g: round1(acc.protein_g + Number(item?.protein_g ?? 0)),
      carbs_g: round1(acc.carbs_g + Number(item?.carbs_g ?? 0)),
      fat_g: round1(acc.fat_g + Number(item?.fat_g ?? 0)),
    }),
    emptyTotals(),
  );
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token && !STOPWORDS.has(token));
}

function dedupeStrings(values) {
  return Array.from(new Set((values ?? []).map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function singularizeToken(token) {
  const value = normalizeText(token);
  if (value.length > 4 && value.endsWith("s")) {
    return value.slice(0, -1);
  }
  return value;
}

function singularizePhrase(value) {
  return tokenize(value).map(singularizeToken).join(" ");
}

function parseLocalizedNumber(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text || text === "-" || text.toLowerCase() === "tr") {
    return 0;
  }

  const normalized = text
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]+/g, "");

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function decodeHtml(value) {
  if (!value) return "";

  let decoded = String(value);
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
  Object.entries(COMMON_ENTITY_MAP).forEach(([entity, replacement]) => {
    decoded = decoded.split(entity).join(replacement);
  });

  return decoded;
}

function stripTags(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function makeTimeoutSignal(timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

async function fetchText(url, options = {}) {
  const timeout = makeTimeoutSignal();

  try {
    const response = await fetch(url, {
      ...options,
      signal: timeout.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    timeout.clear();
  }
}

async function fetchJson(url, options = {}) {
  const timeout = makeTimeoutSignal();

  try {
    const response = await fetch(url, {
      ...options,
      signal: timeout.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    timeout.clear();
  }
}

function splitMealText(rawText) {
  return String(rawText ?? "")
    .replace(/\r?\n/g, " ")
    .split(/,|;|\s+\+\s+|\s+e\s+|\s+com\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseExplicitQuantity(part) {
  const gramsMatch = part.match(/(\d+(?:[.,]\d+)?)\s*(g|grama|gramas|ml)\b/i);
  if (gramsMatch) {
    const amount = Number(gramsMatch[1].replace(",", "."));
    return {
      quantityValue: 1,
      quantityUnit: gramsMatch[2].toLowerCase(),
      estimatedGrams: Number.isFinite(amount) ? amount : null,
      quantityDescription: gramsMatch[0],
    };
  }

  const portionMatch = part.match(/(\d+(?:[.,]\d+)?)\s*(unidade|unidades|ovo|ovos|fatia|fatias|pedaco|pedacos|pedaço|pedaços|colher|colheres|xicara|xicaras|xícara|xícaras|copo|copos|file|files|filé|filés)\b/i);
  if (portionMatch) {
    const amount = Number(portionMatch[1].replace(",", "."));
    return {
      quantityValue: Number.isFinite(amount) && amount > 0 ? amount : 1,
      quantityUnit: normalizeText(portionMatch[2]),
      estimatedGrams: null,
      quantityDescription: portionMatch[0],
    };
  }

  const looseCountMatch = part.match(/^\s*(\d+(?:[.,]\d+)?)\s+([a-zA-Z\u00C0-\u017F].*)$/);
  if (looseCountMatch) {
    const amount = Number(looseCountMatch[1].replace(",", "."));
    return {
      quantityValue: Number.isFinite(amount) && amount > 0 ? amount : 1,
      quantityUnit: "unidade",
      estimatedGrams: null,
      quantityDescription: looseCountMatch[0].trim(),
    };
  }

  return {
    quantityValue: null,
    quantityUnit: null,
    estimatedGrams: null,
    quantityDescription: null,
  };
}

function buildQueryHints(text) {
  const normalized = normalizeText(text);
  const tokens = tokenize(text);
  const withoutQuantities = normalized
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const nounQuery = tokens.filter((token) => token.length > 2).slice(0, 4).join(" ");

  return dedupeStrings([
    text,
    withoutQuantities,
    singularizePhrase(withoutQuantities),
    nounQuery,
    tokens[0],
    singularizeToken(tokens[0]),
  ]);
}

function applyHeuristicOverrides(candidate) {
  const name = normalizeText(candidate.displayName);

  if (name === "cafe") {
    return {
      ...candidate,
      lookupHintsPt: dedupeStrings(["cafe", "bebida cafe", ...candidate.lookupHintsPt]),
      lookupHintsEn: dedupeStrings(["brewed coffee", ...candidate.lookupHintsEn]),
      mustHaveTokens: dedupeStrings(["cafe", ...candidate.mustHaveTokens]).map(singularizeToken),
      avoidTokens: dedupeStrings(["descafeinado", "capuccino", "po", "soluvel", ...candidate.avoidTokens]),
      preparation: candidate.preparation || "infusao",
    };
  }

  if (name === "leite") {
    return {
      ...candidate,
      lookupHintsPt: dedupeStrings(["leite", "leite integral", ...candidate.lookupHintsPt]),
      lookupHintsEn: dedupeStrings(["whole milk", "milk", ...candidate.lookupHintsEn]),
      mustHaveTokens: dedupeStrings(["leite", "integral", ...candidate.mustHaveTokens]).map(singularizeToken),
      avoidTokens: dedupeStrings(["humano", "colostro", "cacau", "chocolate", "bufala", "cabra", "caprino", "po", ...candidate.avoidTokens]),
    };
  }

  if (name === "leite") {
    return {
      ...candidate,
      lookupHintsPt: dedupeStrings(["leite", "leite integral", ...candidate.lookupHintsPt]),
      lookupHintsEn: dedupeStrings(["whole milk", "milk", ...candidate.lookupHintsEn]),
      mustHaveTokens: dedupeStrings(["leite", "integral", ...candidate.mustHaveTokens]).map(singularizeToken),
      avoidTokens: dedupeStrings(["humano", "colostro", "cacau", "chocolate", "bufala", "búfala", ...candidate.avoidTokens]),
    };
  }

  if (name.includes("banana")) {
    return {
      ...candidate,
      lookupHintsPt: dedupeStrings(["banana", ...candidate.lookupHintsPt]),
      mustHaveTokens: dedupeStrings(["banana", ...candidate.mustHaveTokens]).map(singularizeToken),
      avoidTokens: dedupeStrings(["desidratada", "passa", "chips", ...candidate.avoidTokens]),
    };
  }

  if (name.includes("frango")) {
    return {
      ...candidate,
      lookupHintsPt: dedupeStrings(["frango", "peito de frango", ...candidate.lookupHintsPt]),
      lookupHintsEn: dedupeStrings(["skinless grilled chicken breast", "chicken breast", "grilled chicken breast", ...candidate.lookupHintsEn]),
      mustHaveTokens: dedupeStrings([
        "frango",
        ...(name.includes("grelhado") ? ["peito"] : []),
        ...candidate.mustHaveTokens,
      ]).map(singularizeToken),
      avoidTokens: dedupeStrings([
        "sanduiche",
        "hamburguer",
        "pao",
        "maionese",
        "alface",
        "tomate",
        "skin",
        "sauce",
        "bread",
        "sandwich",
        "coracao",
        "moela",
        "coxa",
        ...candidate.avoidTokens,
      ]),
    };
  }

  if (name.includes("frango")) {
    return {
      ...candidate,
      lookupHintsPt: dedupeStrings(["frango", "peito de frango", ...candidate.lookupHintsPt]),
      lookupHintsEn: dedupeStrings(["chicken breast", "grilled chicken breast", ...candidate.lookupHintsEn]),
      mustHaveTokens: dedupeStrings([
        "frango",
        ...(name.includes("grelhado") ? ["peito"] : []),
        ...candidate.mustHaveTokens,
      ]).map(singularizeToken),
      avoidTokens: dedupeStrings(["sanduiche", "hamburguer", "coracao", "coração", "moela", "coxa", ...candidate.avoidTokens]),
    };
  }

  return {
    ...candidate,
    mustHaveTokens: (candidate.mustHaveTokens ?? []).map(singularizeToken),
  };
}

function buildHeuristicCandidates(rawText) {
  const parts = splitMealText(rawText);
  const sourceParts = parts.length > 0 ? parts : [String(rawText ?? "").trim()].filter(Boolean);

  return sourceParts.map((part) => {
    const quantity = parseExplicitQuantity(part);
    const normalizedPart = normalizeText(part)
      .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
      .replace(/\b(g|grama|gramas|ml|unidade|unidades|fatia|fatias|pedaco|pedacos|pedaço|pedaços|colher|colheres|xicara|xicaras|xícara|xícaras|copo|copos|file|files|filé|filés)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const displayName = normalizedPart || normalizeText(part) || part;
    const coreTokens = tokenize(displayName).slice(0, 4);

    return applyHeuristicOverrides({
      displayName,
      lookupHintsPt: buildQueryHints(displayName),
      lookupHintsEn: [],
      mustHaveTokens: coreTokens,
      avoidTokens: [],
      quantityValue: quantity.quantityValue,
      quantityUnit: quantity.quantityUnit,
      quantityDescription: quantity.quantityDescription,
      estimatedGrams: quantity.estimatedGrams,
      preparation: null,
    });
  });
}

function buildExtractionPrompt(rawText) {
  return [
    "You transform Brazilian food log text into structured lookup items for official nutrition sources.",
    "Never calculate calories or macros.",
    "Return ONLY JSON with this shape:",
    "{",
    '  "items": [',
    "    {",
    '      "displayName": string,',
    '      "lookupHintsPt": string[],',
    '      "lookupHintsEn": string[],',
    '      "mustHaveTokens": string[],',
    '      "avoidTokens": string[],',
    '      "quantityValue": number | null,',
    '      "quantityUnit": string | null,',
    '      "quantityDescription": string | null,',
    '      "estimatedGrams": number | null,',
    '      "preparation": string | null',
    "    }",
    "  ]",
    "}",
    "Rules:",
    "- Split combined meals or drinks into separate searchable items when that improves official lookup.",
    '- Example: "cafe com leite" should usually become coffee infusion + milk.',
    "- Keep lookupHintsPt broad enough for Brazilian official database searches.",
    "- lookupHintsEn should help USDA fallback when a Brazilian source does not match.",
    "- mustHaveTokens should contain the main canonical tokens that should appear in the official match.",
    "- avoidTokens should contain obvious false positives to penalize, like sandwich/capuccino when the user did not type that.",
    "- quantityUnit should be normalized in lowercase ascii.",
    "- estimatedGrams may be null if the text does not imply a portion, but when the text clearly states units or cups you should infer grams conservatively.",
    `Input: "${rawText}"`,
  ].join("\n");
}

function parseJsonFromModelText(text) {
  const raw = String(text ?? "").replace(/```json|```/gi, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object returned");
  }
  return JSON.parse(match[0]);
}

function normalizeCandidate(candidate) {
  const displayName = String(candidate?.displayName ?? "").trim();
  const mustHaveTokens = dedupeStrings(candidate?.mustHaveTokens ?? []).map(normalizeText).filter(Boolean);
  const avoidTokens = dedupeStrings(candidate?.avoidTokens ?? []).map(normalizeText).filter(Boolean);

  return {
    displayName,
    lookupHintsPt: dedupeStrings(candidate?.lookupHintsPt ?? [displayName]),
    lookupHintsEn: dedupeStrings(candidate?.lookupHintsEn ?? []),
    mustHaveTokens: mustHaveTokens.length > 0 ? mustHaveTokens : tokenize(displayName).slice(0, 4),
    avoidTokens,
    quantityValue: Number.isFinite(Number(candidate?.quantityValue)) ? Number(candidate.quantityValue) : null,
    quantityUnit: candidate?.quantityUnit ? normalizeText(candidate.quantityUnit) : null,
    quantityDescription: candidate?.quantityDescription ? String(candidate.quantityDescription).trim() : null,
    estimatedGrams: Number.isFinite(Number(candidate?.estimatedGrams)) ? Number(candidate.estimatedGrams) : null,
    preparation: candidate?.preparation ? String(candidate.preparation).trim() : null,
  };
}

async function extractCandidates(rawText) {
  try {
    const data = await chat({
      systemPrompt: [
        "You extract canonical food candidates from Brazilian food journal text.",
        "Return only JSON with shape {\"items\":[{...}]} and no markdown.",
      ].join(" "),
      messages: [{ role: "user", text: buildExtractionPrompt(rawText) }],
    });

    const modelText = data?.outputText;
    const parsed = parseJsonFromModelText(modelText);
    const items = Array.isArray(parsed?.items)
      ? parsed.items.map(normalizeCandidate).map(applyHeuristicOverrides).filter((item) => item.displayName)
      : [];

    if (items.length > 0) {
      return items;
    }
  } catch (error) {
    console.warn("[officialNutrition] candidate extraction failed:", error?.message);
  }

  return buildHeuristicCandidates(rawText);
}

function parseSearchRows(html) {
  const bodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!bodyMatch) return [];

  const anchors = Array.from(bodyMatch[1].matchAll(/<a href='([^']+)'[^>]*>([\s\S]*?)<\/a>/gi))
    .map((match) => ({
      href: match[1],
      text: stripTags(match[2]),
    }));

  const rows = [];
  for (let index = 0; index + 4 < anchors.length; index += 5) {
    const chunk = anchors.slice(index, index + 5);
    rows.push({
      code: chunk[0].text,
      name: chunk[1].text,
      scientificName: chunk[2].text,
      group: chunk[3].text,
      brand: chunk[4].text,
      detailUrl: new URL(chunk[0].href, TBCA_BASE_URL).toString(),
    });
  }

  return rows;
}

async function searchTbca(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  if (tbcaSearchCache.has(normalizedQuery)) {
    return tbcaSearchCache.get(normalizedQuery);
  }

  const body = new URLSearchParams({
    guarda: "tomo1",
    produto: query,
  }).toString();

  const html = await fetchText(TBCA_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const rows = parseSearchRows(html);
  tbcaSearchCache.set(normalizedQuery, rows);
  return rows;
}

function buildResultScore(candidate, row, hints) {
  const name = normalizeText(row.name);
  const mustHave = candidate.mustHaveTokens ?? [];
  const avoid = dedupeStrings([...(candidate.avoidTokens ?? []), ...RESULT_AVOID_TOKENS]);
  const hintTokenSets = hints.map((hint) => tokenize(hint)).filter((tokens) => tokens.length > 0);

  let score = 0;

  hintTokenSets.forEach((tokens, index) => {
    const hits = tokens.filter((token) => name.includes(token));
    score += hits.length * (index === 0 ? 9 : 6);
    score -= (tokens.length - hits.length) * (index === 0 ? 1 : 0.25);
  });

  mustHave.forEach((token) => {
    if (name.includes(token)) {
      score += 12;
    } else {
      score -= 120;
    }
  });

  avoid.forEach((token) => {
    if (token && name.includes(token) && !mustHave.includes(token)) {
      score -= 10;
    }
  });

  const preparation = normalizeText(candidate.preparation);
  if (preparation && name.includes(preparation)) {
    score += 8;
  }

  if (name === normalizeText(candidate.displayName)) {
    score += 14;
  }

  if (name.startsWith(normalizeText(candidate.displayName))) {
    score += 5;
  }

  return score;
}

function rowContainsAvoidToken(candidate, row) {
  const name = normalizeText(row?.name);
  const mustHave = candidate.mustHaveTokens ?? [];
  const avoid = dedupeStrings([...(candidate.avoidTokens ?? []), ...RESULT_AVOID_TOKENS]);

  return avoid.some((token) => token && name.includes(token) && !mustHave.includes(token));
}

function findPresetTbcaRow(candidate, rows) {
  const candidateName = normalizeText(candidate?.displayName);

  if (candidateName.includes("frango") && candidateName.includes("grelh")) {
    return rows.find((row) => row.code === "BRC0114F")
      ?? rows.find((row) => {
        const name = normalizeText(row.name);
        return name.includes("frango") && name.includes("peito") && name.includes("grelhada");
      })
      ?? null;
  }

  if (candidateName === "cafe") {
    return rows.find((row) => {
      const name = normalizeText(row.name);
      return name.includes("bebida") && name.includes("cafe") && name.includes("infusao") && !name.includes("descafeinado");
    }) ?? null;
  }

  return null;
}

function pickBestTbcaResult(candidate, rows, hint) {
  const hints = dedupeStrings([
    hint,
    candidate.displayName,
    ...(candidate.lookupHintsPt ?? []),
  ]);

  const scored = rows
    .map((row) => ({
      ...row,
      score: buildResultScore(candidate, row, hints),
    }))
    .sort((left, right) => right.score - left.score);

  return scored.find((row) => !rowContainsAvoidToken(candidate, row)) ?? scored[0] ?? null;
}

function parseTbcaMeasureHeader(html) {
  const match = html.match(/<thead><tr><th>Componente<\/th><th>Unidades<\/th><th>Valor por 100g<\/th><th>([\s\S]*?)<\/th>/i);
  if (!match) {
    return null;
  }

  const label = stripTags(match[1]);
  const gramsMatch = label.match(/\(([\d.,]+)\s*g\)/i);

  return {
    label,
    grams: gramsMatch ? parseLocalizedNumber(gramsMatch[1]) : null,
  };
}

function parseTbcaMetric(html, metricName, unitName) {
  const escapedMetric = metricName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedUnit = unitName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `<tr><td>${escapedMetric}<\\/td><td>${escapedUnit}<\\/td><td>([^<]+)<\\/td>(?:<td>([^<]*)<\\/td>)?`,
    "i",
  );
  const match = html.match(regex);

  if (!match) {
    return { per100g: 0, perMeasure: null };
  }

  return {
    per100g: parseLocalizedNumber(match[1]) ?? 0,
    perMeasure: match[2] !== undefined ? parseLocalizedNumber(match[2]) : null,
  };
}

function parseTbcaReferences(html) {
  const sourceMatch = html.match(/Fonte de dados:<\/h4>([\s\S]*?)(?:<div class='card-footer'|<div class="card-footer"|<footer|<\/main>)/i);
  if (!sourceMatch) {
    return [];
  }

  return sourceMatch[1]
    .split(/<br\s*\/?>/i)
    .map((entry) => stripTags(entry))
    .filter(Boolean);
}

async function fetchTbcaDetail(detailUrl) {
  if (tbcaDetailCache.has(detailUrl)) {
    return tbcaDetailCache.get(detailUrl);
  }

  const html = await fetchText(detailUrl);
  const measure = parseTbcaMeasureHeader(html);
  const calories = parseTbcaMetric(html, "Energia", "kcal");
  const protein = parseTbcaMetric(html, "Proteína", "g");
  const carbs = parseTbcaMetric(html, "Carboidrato disponível", "g");
  const fat = parseTbcaMetric(html, "Lipídios", "g");
  const titleMatch = html.match(/Descrição:<\/strong>\s*([\s\S]*?)<br>/i);
  const description = titleMatch ? stripTags(titleMatch[1]) : null;

  const detail = {
    sourceLabel: "TBCA / USP",
    sourceKey: "tbca",
    description,
    detailUrl,
    per100g: {
      calories: calories.per100g ?? 0,
      protein_g: protein.per100g ?? 0,
      carbs_g: carbs.per100g ?? 0,
      fat_g: fat.per100g ?? 0,
    },
    measure: measure ? {
      ...measure,
      calories: calories.perMeasure,
      protein_g: protein.perMeasure,
      carbs_g: carbs.perMeasure,
      fat_g: fat.perMeasure,
    } : null,
    references: parseTbcaReferences(html),
  };

  tbcaDetailCache.set(detailUrl, detail);
  return detail;
}

function nutrientValue(food, nutrientId, fallbackNames = []) {
  const items = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  const fallbackSet = new Set(fallbackNames.map((value) => normalizeText(value)));

  const match = items.find((nutrient) => {
    if (nutrient?.nutrientId === nutrientId) return true;
    return fallbackSet.has(normalizeText(nutrient?.nutrientName));
  });

  return Number(match?.value ?? 0);
}

async function searchUsda(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  if (usdaSearchCache.has(normalizedQuery)) {
    return usdaSearchCache.get(normalizedQuery);
  }

  const apiKey = AI_CONFIG.usdaApiKey || USDA_DEMO_KEY;
  const data = await fetchJson(`${USDA_SEARCH_URL}?api_key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      pageSize: 12,
      dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
    }),
  });

  const foods = (Array.isArray(data?.foods) ? data.foods : [])
    .filter((food) => food?.dataType !== "Branded")
    .map((food) => ({
      sourceLabel: "USDA FoodData Central",
      sourceKey: "usda",
      description: food.description,
      detailUrl: `${USDA_WEB_URL}${food.fdcId}/nutrients`,
      references: [
        `FDC ID ${food.fdcId}`,
        `Data type: ${food.dataType}`,
      ],
      per100g: {
        calories: nutrientValue(food, 1008, ["Energy"]),
        protein_g: nutrientValue(food, 1003, ["Protein"]),
        carbs_g: nutrientValue(food, 1005, ["Carbohydrate, by difference"]),
        fat_g: nutrientValue(food, 1004, ["Total lipid (fat)"]),
      },
      measure: Number.isFinite(Number(food?.servingSize)) ? {
        label: food?.householdServingFullText || `${food.servingSize} ${food?.servingSizeUnit || "g"}`,
        grams: Number(food.servingSize),
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
      } : null,
    }));

  usdaSearchCache.set(normalizedQuery, foods);
  return foods;
}

function isCompatibleMeasureUnit(quantityUnit, measureLabel) {
  if (!quantityUnit || !measureLabel) {
    return false;
  }

  const unit = normalizeText(quantityUnit);
  const label = normalizeText(measureLabel);

  if (["unidade", "unidades", "ovo", "ovos"].includes(unit) && /unidade|pedaco|pedaço|fatia|file|filé/.test(label)) {
    return true;
  }

  if (["colher", "colheres"].includes(unit) && /colher/.test(label)) {
    return true;
  }

  if (["xicara", "xicaras"].includes(unit) && /xicara|xícara/.test(measureLabel)) {
    return true;
  }

  if (["copo", "copos"].includes(unit) && /copo/.test(label)) {
    return true;
  }

  if (["fatia", "fatias", "pedaco", "pedacos", "pedaço", "pedaços", "file", "files", "filé", "filés"].includes(unit) &&
    /fatia|pedaco|pedaço|file|filé/.test(label)) {
    return true;
  }

  return false;
}

function resolvePortion(detail, candidate) {
  const explicitGrams = Number(candidate?.estimatedGrams);
  if (Number.isFinite(explicitGrams) && explicitGrams > 0) {
    return {
      grams: explicitGrams,
      quantityDescription: candidate.quantityDescription || `${round1(explicitGrams)} g`,
      useMeasureValues: false,
    };
  }

  const quantityValue = Number(candidate?.quantityValue);
  const quantityUnit = candidate?.quantityUnit;
  const measure = detail?.measure;
  const multiplier = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;

  if (measure?.grams && (isCompatibleMeasureUnit(quantityUnit, measure.label) || (!quantityUnit && !quantityValue))) {
    return {
      grams: measure.grams * multiplier,
      quantityDescription: candidate?.quantityDescription || (multiplier === 1 ? measure.label : `${multiplier} x ${measure.label}`),
      useMeasureValues: Boolean(
        measure.calories !== null &&
        measure.protein_g !== null &&
        measure.carbs_g !== null &&
        measure.fat_g !== null,
      ),
      measureMultiplier: multiplier,
    };
  }

  if (measure?.grams && !quantityUnit && Number.isFinite(quantityValue) && quantityValue > 0) {
    return {
      grams: measure.grams * quantityValue,
      quantityDescription: candidate?.quantityDescription || `${quantityValue} x ${measure.label}`,
      useMeasureValues: Boolean(
        measure.calories !== null &&
        measure.protein_g !== null &&
        measure.carbs_g !== null &&
        measure.fat_g !== null,
      ),
      measureMultiplier: quantityValue,
    };
  }

  return {
    grams: 100,
    quantityDescription: candidate?.quantityDescription || "100 g",
    useMeasureValues: false,
  };
}

function scaleFromPer100g(per100g, grams) {
  const ratio = (Number(grams) || 0) / 100;
  return {
    calories: round1((per100g?.calories ?? 0) * ratio),
    protein_g: round1((per100g?.protein_g ?? 0) * ratio),
    carbs_g: round1((per100g?.carbs_g ?? 0) * ratio),
    fat_g: round1((per100g?.fat_g ?? 0) * ratio),
  };
}

function scaleFromMeasure(detail, multiplier = 1) {
  return {
    calories: round1((detail?.measure?.calories ?? 0) * multiplier),
    protein_g: round1((detail?.measure?.protein_g ?? 0) * multiplier),
    carbs_g: round1((detail?.measure?.carbs_g ?? 0) * multiplier),
    fat_g: round1((detail?.measure?.fat_g ?? 0) * multiplier),
  };
}

function buildResolvedItem(candidate, detail) {
  const portion = resolvePortion(detail, candidate);
  const totals = portion.useMeasureValues
    ? scaleFromMeasure(detail, portion.measureMultiplier ?? 1)
    : scaleFromPer100g(detail.per100g, portion.grams);

  return {
    name: candidate.displayName,
    matchedOfficialName: detail.description || candidate.displayName,
    quantity_g: round1(portion.grams),
    quantityDescription: portion.quantityDescription,
    calories: totals.calories,
    protein_g: totals.protein_g,
    carbs_g: totals.carbs_g,
    fat_g: totals.fat_g,
    confidence: detail.sourceKey === "tbca" ? 0.95 : 0.88,
    sourceLabel: detail.sourceLabel,
    sourceUrl: detail.detailUrl,
    sourceKey: detail.sourceKey,
  };
}

function dedupeSources(items, resolvedDetails) {
  const seen = new Set();

  return resolvedDetails
    .map((detail, index) => ({
      label: detail.sourceLabel,
      url: detail.detailUrl,
      matchName: detail.description || items[index]?.matchedOfficialName || items[index]?.name,
      references: detail.references ?? [],
    }))
    .filter((source) => {
      const key = `${source.label}:${source.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function resolveViaTbca(candidate) {
  const hints = dedupeStrings(candidate.lookupHintsPt ?? [candidate.displayName]);

  let bestRow = null;
  for (const hint of hints) {
    const rows = await searchTbca(hint);
    if (!rows.length) continue;

    const presetRow = findPresetTbcaRow(candidate, rows);
    const current = presetRow ? { ...presetRow, score: 999 } : pickBestTbcaResult(candidate, rows, hint);
    if (current) {
      const currentAvoid = rowContainsAvoidToken(candidate, current);
      const bestAvoid = bestRow ? rowContainsAvoidToken(candidate, bestRow) : false;

      if (
        !bestRow ||
        (bestAvoid && !currentAvoid) ||
        (bestAvoid === currentAvoid && current.score > bestRow.score)
      ) {
        bestRow = current;
      }
    }
  }

  if (!bestRow || bestRow.score < 5) {
    return null;
  }

  return fetchTbcaDetail(bestRow.detailUrl);
}

async function resolveViaUsda(candidate) {
  const hints = dedupeStrings([
    ...(candidate.lookupHintsEn ?? []),
    candidate.displayName,
  ]);

  let best = null;
  for (const hint of hints) {
    const rows = await searchUsda(hint);
    if (!rows.length) continue;

    const current = rows
      .map((row) => ({
        ...row,
        score: buildResultScore({
          ...candidate,
          mustHaveTokens: tokenize(hint).slice(0, 4),
        }, { name: row.description }, [hint]),
      }))
      .sort((left, right) => right.score - left.score)[0];

    if (current && (!best || current.score > best.score)) {
      best = current;
    }
  }

  if (!best || best.score < 6) {
    return null;
  }

  return best;
}

function buildReasoning(items, sources, unresolvedItems) {
  const sourceLabels = dedupeStrings(sources.map((source) => source.label));
  const resolvedNames = items.map((item) => `${item.name} -> ${item.matchedOfficialName}`).join("; ");
  const unresolvedText = unresolvedItems.length > 0
    ? ` Unresolved: ${unresolvedItems.join(", ")}.`
    : "";

  return `Official lookup used ${sourceLabels.join(" + ")}. ${resolvedNames}.${unresolvedText}`;
}

export async function analyzeLineWithOfficialSources(rawText) {
  const candidates = await extractCandidates(rawText);
  const resolvedItems = [];
  const resolvedDetails = [];
  const unresolvedItems = [];

  for (const candidate of candidates) {
    let detail = null;

    try {
      detail = await resolveViaTbca(candidate);
      if (!detail) {
        detail = await resolveViaUsda(candidate);
      }
    } catch (error) {
      console.warn("[officialNutrition] resolve failed:", error?.message);
    }

    if (!detail) {
      unresolvedItems.push(candidate.displayName);
      continue;
    }

    resolvedDetails.push(detail);
    resolvedItems.push(buildResolvedItem(candidate, detail));
  }

  if (!resolvedItems.length) {
    throw new Error("Nao encontrei uma fonte oficial confiavel para este alimento.");
  }

  const sources = dedupeSources(resolvedItems, resolvedDetails);

  return {
    items: resolvedItems,
    totals: sumTotals(resolvedItems),
    reasoning: buildReasoning(resolvedItems, sources, unresolvedItems),
    confidence: unresolvedItems.length > 0 ? "medium" : "high",
    sources,
    unresolvedItems,
  };
}
