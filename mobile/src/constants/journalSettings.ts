export const ACTIVITY_LEVEL_OPTIONS = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Little exercise during the week.",
  },
  {
    value: "light",
    label: "Lightly Active",
    description: "Light training 1 to 3 days per week.",
  },
  {
    value: "moderate",
    label: "Moderately Active",
    description: "Moderate training 3 to 5 days per week.",
  },
  {
    value: "very",
    label: "Very Active",
    description: "Hard training on most days.",
  },
] as const;

export const CALORIE_BIAS_OPTIONS = [
  {
    value: "accurate",
    label: "Accurate",
    description: "Balanced estimate for everyday logging.",
  },
  {
    value: "conservative",
    label: "Conservative",
    description: "Slightly lower calorie estimates.",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    description: "Slightly higher calorie estimates.",
  },
] as const;

export const DICTATION_LANGUAGE_OPTIONS = [
  {
    value: "auto",
    label: "Auto-detect",
    description: "Use the system language automatically.",
  },
  {
    value: "pt-BR",
    label: "Portuguese (Brazil)",
    description: "Prioritize Portuguese food names and dictation.",
  },
  {
    value: "en-US",
    label: "English (US)",
    description: "Prioritize English dictation and commands.",
  },
] as const;

export function getActivityLevelLabel(value?: string) {
  return ACTIVITY_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? "Moderately Active";
}

export function getCalorieBiasLabel(value?: string) {
  return CALORIE_BIAS_OPTIONS.find((option) => option.value === value)?.label ?? "Accurate";
}

export function getDictationLanguageLabel(value?: string) {
  return DICTATION_LANGUAGE_OPTIONS.find((option) => option.value === value)?.label ?? "Auto-detect";
}

export function formatWeightKg(value?: number) {
  const numeric = Number(value ?? 0);
  return `${numeric.toFixed(1)} kg`;
}

export function formatNutritionGoalsSummary(goals?: {
  calories?: number;
  carbs_g?: number;
  fat_g?: number;
  protein_g?: number;
}) {
  const calories = Math.round(Number(goals?.calories ?? 0));
  const protein = Math.round(Number(goals?.protein_g ?? 0));
  const carbs = Math.round(Number(goals?.carbs_g ?? 0));
  const fat = Math.round(Number(goals?.fat_g ?? 0));

  return `${calories.toLocaleString("en-US")} cal · P ${protein}g · C ${carbs}g · F ${fat}g`;
}
