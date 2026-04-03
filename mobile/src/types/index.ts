export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ParsedItem {
  name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
}

export interface ParsedResult {
  items: ParsedItem[];
  totals: NutritionTotals;
}

export interface MealEntry {
  id: string;
  date: string;
  createdAt: string;
  rawText?: string;
  imageUri?: string;
  parsedResult?: ParsedResult;
  isProcessing?: boolean;
}

export interface NutritionGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type RootStackParamList = {
  Journal: undefined;
  History: undefined;
  Settings: undefined;
};
