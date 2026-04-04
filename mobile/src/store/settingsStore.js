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

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      savedMeals: [],

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
      partialize: (state) => ({ savedMeals: state.savedMeals }),
    },
  ),
);

export { normalizeMealKey };
