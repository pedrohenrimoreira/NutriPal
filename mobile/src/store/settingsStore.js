import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

function normalizeMealKey(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createWeightEntry(weightKg, date = new Date().toISOString().slice(0, 10)) {
  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    date,
    weightKg,
  };
}

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      autoTimeZone: true,
      calorieEstimateBias: "accurate",
      dictationLanguage: "auto",
      journalBottomAccessoryMode: "regular",
      healthProfile: {
        activityLevel: "moderate",
        currentWeightKg: 61.5,
      },
      nutritionGoals: {
        calories: 2729,
        carbs_g: 303,
        fat_g: 91,
        protein_g: 136,
      },
      reminders: false,
      savedMeals: [],
      weightEntries: [createWeightEntry(61.5)],

      setAutoTimeZone: (autoTimeZone) => set({ autoTimeZone }),
      setCalorieEstimateBias: (calorieEstimateBias) => set({ calorieEstimateBias }),
      setDictationLanguage: (dictationLanguage) => set({ dictationLanguage }),
      setJournalBottomAccessoryMode: (journalBottomAccessoryMode) =>
        set({
          journalBottomAccessoryMode:
            journalBottomAccessoryMode === "compact" ? "compact" : "regular",
        }),
      setHealthProfile: (updates) =>
        set((state) => ({
          healthProfile: {
            ...state.healthProfile,
            ...updates,
          },
        })),
      setNutritionGoals: (updates) =>
        set((state) => ({
          nutritionGoals: {
            ...state.nutritionGoals,
            ...updates,
          },
        })),
      setReminders: (reminders) => set({ reminders }),

      addSavedMeal: (meal) =>
        set((state) => {
          const nextMeal = {
            ...meal,
            id: createId(),
            createdAt: new Date().toISOString(),
          };
          const nextKey = normalizeMealKey(meal.name);
          const rest = state.savedMeals.filter(
            (item) => normalizeMealKey(item.name) !== nextKey,
          );
          return { savedMeals: [nextMeal, ...rest] };
        }),

      removeSavedMeal: (id) =>
        set((state) => ({
          savedMeals: state.savedMeals.filter((meal) => meal.id !== id),
        })),

      addWeightEntry: ({ date, weightKg }) =>
        set((state) => {
          const numericWeight = Number(weightKg);
          if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
            return state;
          }

          return {
            healthProfile: {
              ...state.healthProfile,
              currentWeightKg: numericWeight,
            },
            weightEntries: [createWeightEntry(numericWeight, date), ...state.weightEntries],
          };
        }),

      removeWeightEntry: (id) =>
        set((state) => {
          const weightEntries = state.weightEntries.filter((entry) => entry.id !== id);
          const latestWeight = weightEntries[0]?.weightKg ?? state.healthProfile.currentWeightKg;

          return {
            healthProfile: {
              ...state.healthProfile,
              currentWeightKg: latestWeight,
            },
            weightEntries,
          };
        }),

      getSavedMealByText: (text) => {
        const normalized = normalizeMealKey(text);
        if (!normalized) return null;

        const meals = get().savedMeals;

        return (
          meals.find((meal) => normalizeMealKey(meal.name) === normalized) ??
          meals.find((meal) => normalizeMealKey(meal.items) === normalized) ??
          meals.find((meal) => normalized.includes(normalizeMealKey(meal.name))) ??
          null
        );
      },
    }),
    {
      name: "nutripal-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        autoTimeZone: state.autoTimeZone,
        calorieEstimateBias: state.calorieEstimateBias,
        dictationLanguage: state.dictationLanguage,
        journalBottomAccessoryMode: state.journalBottomAccessoryMode,
        healthProfile: state.healthProfile,
        nutritionGoals: state.nutritionGoals,
        reminders: state.reminders,
        savedMeals: state.savedMeals,
        weightEntries: state.weightEntries,
      }),
    },
  ),
);

export { normalizeMealKey };
