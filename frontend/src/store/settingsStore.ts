/**
 * store/settingsStore.ts – Zustand store para preferencias do usuario.
 *
 * Persistido via middleware `persist` no localStorage.
 * Gerencia metas nutricionais, preferencias visuais e configuracoes do app.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalorieBias = 'underestimate' | 'accurate' | 'overestimate';
export type AppTheme = 'system' | 'dark' | 'light';
export type AppLanguage = 'pt-BR' | 'en';
export type GoalBarItem = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber';

export interface NutritionGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface UserProfile {
  name: string;
  email: string;
  weight_kg: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  items: string; // raw text description
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  createdAt: string; // ISO date string
}

export interface SettingsState {
  // Profile
  profile: UserProfile;

  // Goals
  goals: NutritionGoals;

  // Preferences
  calorieBias: CalorieBias;
  goalBarItems: GoalBarItem[];
  dailyReminders: boolean;
  theme: AppTheme;
  language: AppLanguage;

  // Saved Meals
  savedMeals: SavedMeal[];

  // Actions - Profile
  updateProfile: (partial: Partial<UserProfile>) => void;

  // Actions - Goals
  updateGoals: (partial: Partial<NutritionGoals>) => void;

  // Actions - Preferences
  setCalorieBias: (bias: CalorieBias) => void;
  setGoalBarItems: (items: GoalBarItem[]) => void;
  toggleDailyReminders: () => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (lang: AppLanguage) => void;

  // Actions - Saved Meals
  addSavedMeal: (meal: Omit<SavedMeal, 'id' | 'createdAt'>) => void;
  removeSavedMeal: (id: string) => void;

  // Actions - Data management
  clearAllData: () => void;
  exportData: () => string; // returns JSON string of all settings
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PROFILE: UserProfile = {
  name: 'Pedro Moreira',
  email: 'pedrohenriqmoreira@gmail.com',
  weight_kg: 61.5,
};

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2729,
  protein_g: 126,
  carbs_g: 385,
  fat_g: 75,
};

const DEFAULT_CALORIE_BIAS: CalorieBias = 'overestimate';
const DEFAULT_GOAL_BAR_ITEMS: GoalBarItem[] = ['calories', 'protein', 'carbs', 'fat'];
const DEFAULT_DAILY_REMINDERS = false;
const DEFAULT_THEME: AppTheme = 'system';
const DEFAULT_LANGUAGE: AppLanguage = 'pt-BR';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      profile: { ...DEFAULT_PROFILE },
      goals: { ...DEFAULT_GOALS },
      calorieBias: DEFAULT_CALORIE_BIAS,
      goalBarItems: [...DEFAULT_GOAL_BAR_ITEMS],
      dailyReminders: DEFAULT_DAILY_REMINDERS,
      theme: DEFAULT_THEME,
      language: DEFAULT_LANGUAGE,
      savedMeals: [],

      updateProfile: (partial) =>
        set((state) => ({ profile: { ...state.profile, ...partial } })),

      updateGoals: (partial) =>
        set((state) => ({ goals: { ...state.goals, ...partial } })),

      setCalorieBias: (bias) => set({ calorieBias: bias }),

      setGoalBarItems: (items) => set({ goalBarItems: items }),

      toggleDailyReminders: () =>
        set((state) => ({ dailyReminders: !state.dailyReminders })),

      setTheme: (theme) => set({ theme }),

      setLanguage: (lang) => set({ language: lang }),

      addSavedMeal: (meal) =>
        set((state) => ({
          savedMeals: [
            ...state.savedMeals,
            {
              ...meal,
              id: createId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      removeSavedMeal: (id) =>
        set((state) => ({
          savedMeals: state.savedMeals.filter((m) => m.id !== id),
        })),

      clearAllData: () => {
        set({
          profile: { ...DEFAULT_PROFILE },
          goals: { ...DEFAULT_GOALS },
          calorieBias: DEFAULT_CALORIE_BIAS,
          goalBarItems: [...DEFAULT_GOAL_BAR_ITEMS],
          dailyReminders: DEFAULT_DAILY_REMINDERS,
          theme: DEFAULT_THEME,
          language: DEFAULT_LANGUAGE,
          savedMeals: [],
        });
        // Avoid hard dependency on IndexedDB at startup (Safari compatibility).
        try {
          localStorage.removeItem('nutrilens-settings');
        } catch {
          // Ignore storage cleanup errors.
        }
        window.location.reload();
      },

      exportData: () => {
        const { profile, goals, calorieBias, goalBarItems, dailyReminders, theme, language, savedMeals } = get();
        return JSON.stringify({
          profile,
          goals,
          calorieBias,
          goalBarItems,
          dailyReminders,
          theme,
          language,
          savedMeals,
        });
      },
    }),
    {
      name: 'nutrilens-settings',
    },
  ),
);
