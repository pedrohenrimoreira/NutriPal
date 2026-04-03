/**
 * Domain contracts for NutriLens food parsing and journal entities.
 */

export type FoodSource = 'taco' | 'usda' | 'open_food_facts' | 'manual';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ResolvedBy = 'dataset' | 'llm_cheap' | 'llm_medium' | 'vision';

export interface NutritionPer100g {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sodium_mg?: number;
}

export interface DefaultPortion {
  grams: number;
  label: string;
}

/**
 * Dataset food item (Layer 0).
 */
export interface FoodItem {
  id: string;
  name: string;
  aliases: string[];
  per100g: NutritionPer100g;
  defaultPortion: DefaultPortion;
  source: FoodSource;
}

/**
 * One parsed item in a response.
 */
export interface NutritionItem {
  name: string;
  quantityDescription: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: ConfidenceLevel;
  resolvedBy: ResolvedBy;
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/**
 * Parsed result for text or image input.
 */
export interface ParsedNutrition {
  items: NutritionItem[];
  totals: NutritionTotals;
  confidence: ConfidenceLevel;
  source: ResolvedBy;
  uncertaintyNotes: string | null;
  estimatedErrorPct?: number | null;
}

export interface MealEntry {
  id: string;
  rawText: string;
  imageUrl?: string;
  parsedResult?: ParsedNutrition;
  createdAt: Date;
  date: string;
  isDirty: boolean;
}

export interface DayLog {
  date: string;
  entries: MealEntry[];
  streakDay: number;
}
