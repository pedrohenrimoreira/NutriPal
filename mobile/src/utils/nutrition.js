import { useSettingsStore, normalizeMealKey } from "../store/settingsStore";

const FOOD_LIBRARY = [
  {
    name: "Arroz branco",
    aliases: ["arroz branco", "arroz", "arroz cozido"],
    grams: 150,
    per100g: { calories: 128, protein_g: 2.5, carbs_g: 28.1, fat_g: 0.2 },
  },
  {
    name: "Arroz integral",
    aliases: ["arroz integral", "arroz integral cozido"],
    grams: 150,
    per100g: { calories: 124, protein_g: 2.6, carbs_g: 25.8, fat_g: 1.0 },
  },
  {
    name: "Feijao",
    aliases: ["feijao", "feijao carioca", "feijão", "feijão carioca"],
    grams: 100,
    per100g: { calories: 76, protein_g: 4.8, carbs_g: 13.6, fat_g: 0.5 },
  },
  {
    name: "Frango grelhado",
    aliases: ["frango grelhado", "peito de frango", "frango", "chicken breast"],
    grams: 120,
    per100g: { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  },
  {
    name: "Ovo",
    aliases: ["ovo", "ovos", "ovo mexido", "ovos mexidos", "omelete"],
    grams: 50,
    per100g: { calories: 143, protein_g: 13, carbs_g: 0.7, fat_g: 9.5 },
  },
  {
    name: "Banana",
    aliases: ["banana", "banana prata", "banana nanica"],
    grams: 90,
    per100g: { calories: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
  },
  {
    name: "Pao frances",
    aliases: ["pao", "pão", "pao frances", "pão francês", "paozinho"],
    grams: 50,
    per100g: { calories: 300, protein_g: 8.5, carbs_g: 58.6, fat_g: 3.1 },
  },
  {
    name: "Queijo",
    aliases: ["queijo", "mussarela", "muçarela", "queijo minas"],
    grams: 30,
    per100g: { calories: 321, protein_g: 22.7, carbs_g: 2.2, fat_g: 25.2 },
  },
  {
    name: "Leite",
    aliases: ["leite", "leite integral"],
    grams: 200,
    per100g: { calories: 61, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.3 },
  },
  {
    name: "Whey protein",
    aliases: ["whey", "whey protein", "shake de whey"],
    grams: 30,
    per100g: { calories: 400, protein_g: 80, carbs_g: 10, fat_g: 6.7 },
  },
  {
    name: "Aveia",
    aliases: ["aveia", "oatmeal"],
    grams: 40,
    per100g: { calories: 389, protein_g: 16.9, carbs_g: 66.3, fat_g: 6.9 },
  },
  {
    name: "Batata doce",
    aliases: ["batata doce", "batata-doce"],
    grams: 130,
    per100g: { calories: 86, protein_g: 1.6, carbs_g: 20.1, fat_g: 0.1 },
  },
  {
    name: "Carne bovina",
    aliases: ["carne", "carne bovina", "bife", "patinho"],
    grams: 120,
    per100g: { calories: 250, protein_g: 26, carbs_g: 0, fat_g: 15 },
  },
  {
    name: "Lettuce",
    aliases: ["alface", "salada", "salada de alface", "lettuce"],
    grams: 80,
    per100g: { calories: 15, protein_g: 1.4, carbs_g: 2.9, fat_g: 0.2 },
  },
];

function roundMacro(value) {
  return Math.round(value * 10) / 10;
}

function createItem(name, grams, per100g, confidence = 0.82) {
  const ratio = grams / 100;
  const calories = roundMacro(per100g.calories * ratio);
  const protein_g = roundMacro(per100g.protein_g * ratio);
  const carbs_g = roundMacro(per100g.carbs_g * ratio);
  const fat_g = roundMacro(per100g.fat_g * ratio);

  return {
    name,
    quantity_g: roundMacro(grams),
    calories,
    protein_g,
    carbs_g,
    fat_g,
    confidence,
  };
}

function totalsFromItems(items) {
  return items.reduce(
    (acc, item) => ({
      calories: roundMacro(acc.calories + item.calories),
      protein_g: roundMacro(acc.protein_g + item.protein_g),
      carbs_g: roundMacro(acc.carbs_g + item.carbs_g),
      fat_g: roundMacro(acc.fat_g + item.fat_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

function extractQuantity(text) {
  const quantityMatch = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!quantityMatch) return 1;
  const numeric = Number(quantityMatch[1].replace(",", "."));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function splitMealText(rawText) {
  return rawText
    .split(/,|;|\n|\s+\+\s+|\s+e\s+|\s+com\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function matchFood(part) {
  const normalizedPart = normalizeMealKey(part);
  const quantity = extractQuantity(part);

  let bestMatch = null;
  let bestAliasLength = 0;

  for (const food of FOOD_LIBRARY) {
    for (const alias of food.aliases) {
      const normalizedAlias = normalizeMealKey(alias);
      if (
        normalizedPart.includes(normalizedAlias) &&
        normalizedAlias.length > bestAliasLength
      ) {
        bestMatch = food;
        bestAliasLength = normalizedAlias.length;
      }
    }
  }

  if (!bestMatch) return null;

  return createItem(
    bestMatch.name,
    bestMatch.grams * quantity,
    bestMatch.per100g,
    0.86,
  );
}

function createFallbackItem(rawText) {
  const normalized = normalizeMealKey(rawText);
  const words = normalized.split(" ").filter(Boolean);

  let calories = 220;
  let protein_g = 12;
  let carbs_g = 24;
  let fat_g = 8;

  if (/(frango|carne|bife|ovo|whey|atum|peixe|protein)/.test(normalized)) {
    protein_g += 14;
    calories += 70;
  }
  if (/(arroz|pao|pão|banana|aveia|batata|macarrao|massa|tapioca)/.test(normalized)) {
    carbs_g += 18;
    calories += 80;
  }
  if (/(queijo|manteiga|amendoim|castanha|abacate|azeite)/.test(normalized)) {
    fat_g += 10;
    calories += 90;
  }

  calories += Math.max(0, words.length - 2) * 18;

  return {
    name: rawText.trim(),
    quantity_g: 100,
    calories: roundMacro(calories),
    protein_g: roundMacro(protein_g),
    carbs_g: roundMacro(carbs_g),
    fat_g: roundMacro(fat_g),
    confidence: 0.55,
  };
}

export function estimateNutritionFromText(rawText, savedMeals = []) {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      items: [],
      totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    };
  }

  const normalized = normalizeMealKey(trimmed);
  const savedMeal =
    savedMeals.find((meal) => normalizeMealKey(meal.name) === normalized) ??
    savedMeals.find((meal) => normalizeMealKey(meal.items) === normalized) ??
    null;

  if (savedMeal) {
    const item = {
      name: savedMeal.name,
      quantity_g: 1,
      calories: roundMacro(savedMeal.calories),
      protein_g: roundMacro(savedMeal.protein_g),
      carbs_g: roundMacro(savedMeal.carbs_g),
      fat_g: roundMacro(savedMeal.fat_g),
      confidence: 0.98,
      savedMealId: savedMeal.id,
    };
    return {
      items: [item],
      totals: totalsFromItems([item]),
      matchedSavedMeal: savedMeal,
    };
  }

  const matchedItems = splitMealText(trimmed)
    .map((part) => matchFood(part))
    .filter(Boolean);

  if (matchedItems.length > 0) {
    return {
      items: matchedItems,
      totals: totalsFromItems(matchedItems),
    };
  }

  const fallbackItem = createFallbackItem(trimmed);
  return {
    items: [fallbackItem],
    totals: totalsFromItems([fallbackItem]),
  };
}

export function estimateNutritionForCurrentInput(rawText) {
  const savedMeals = useSettingsStore.getState().savedMeals;
  return estimateNutritionFromText(rawText, savedMeals);
}
