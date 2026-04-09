import { create } from "zustand";

export interface JournalNutritionSource {
  label?: string;
  matchName?: string;
  url?: string;
}

export interface JournalNutritionItem {
  calories?: number;
  matchedOfficialName?: string;
  name?: string;
  quantityDescription?: string;
}

export interface JournalNutritionTotals {
  calories?: number;
  carbs_g?: number;
  fat_g?: number;
  protein_g?: number;
}

export interface JournalNutritionDetail {
  items?: JournalNutritionItem[];
  reasoning?: string | null;
  sourceText?: string;
  sources?: JournalNutritionSource[];
  totals?: JournalNutritionTotals;
  type?: string;
}

export interface SavedMealDraft {
  items: string;
  suggestedName: string;
  totals: {
    calories: number;
    carbs_g: number;
    fat_g: number;
    protein_g: number;
  };
}

interface JournalUiState {
  clearNutritionDetail: () => void;
  clearSavedMealDraft: () => void;
  nutritionDetail: JournalNutritionDetail | null;
  savedMealDraft: SavedMealDraft | null;
  setNutritionDetail: (detail: JournalNutritionDetail | null) => void;
  setSavedMealDraft: (draft: SavedMealDraft | null) => void;
}

export const useJournalUiStore = create<JournalUiState>((set) => ({
  clearNutritionDetail: () => set({ nutritionDetail: null }),
  clearSavedMealDraft: () => set({ savedMealDraft: null }),
  nutritionDetail: null,
  savedMealDraft: null,
  setNutritionDetail: (detail) => set({ nutritionDetail: detail }),
  setSavedMealDraft: (draft) => set({ savedMealDraft: draft }),
}));

