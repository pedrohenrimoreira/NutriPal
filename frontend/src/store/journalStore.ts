/**
 * store/journalStore.ts - In-memory journal store (scaffold-safe).
 *
 * This keeps the app interactive now without implementing full persistence.
 * Dexie/IndexedDB wiring can replace the in-memory map in the next phase.
 */

import { create } from 'zustand';
import type { MealEntry } from '../types/food';

const inMemoryLogs: Record<string, MealEntry[]> = {};

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDateKey(input?: Date): string {
  const d = input ?? new Date();
  return d.toISOString().slice(0, 10);
}

function cloneEntries(entries: MealEntry[]): MealEntry[] {
  return entries.map((entry) => ({
    ...entry,
    createdAt: new Date(entry.createdAt),
    parsedResult: entry.parsedResult ? { ...entry.parsedResult } : entry.parsedResult,
  }));
}

export interface JournalState {
  selectedDate: string;
  entries: MealEntry[];
  isLoading: boolean;
  loadDay: (date: string) => Promise<void>;
  addTextEntry: (rawText: string) => Promise<void>;
  addImageEntry: (imageUrl: string) => Promise<void>;
  updateParsedResult: (entryId: string, result: MealEntry['parsedResult']) => void;
  removeEntry: (entryId: string) => Promise<void>;
  setDate: (date: string) => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  selectedDate: getDateKey(),
  entries: [],
  isLoading: false,

  loadDay: async (date: string): Promise<void> => {
    set({ isLoading: true });
    const dayEntries = inMemoryLogs[date] ?? [];
    set({ entries: cloneEntries(dayEntries), isLoading: false });
  },

  addTextEntry: async (rawText: string): Promise<void> => {
    const state = get();
    const text = rawText.trim();
    if (!text) return;

    const nextEntry: MealEntry = {
      id: makeId(),
      rawText: text,
      createdAt: new Date(),
      date: state.selectedDate,
      isDirty: true,
    };

    const existing = inMemoryLogs[state.selectedDate] ?? [];
    const updated = [...existing, nextEntry];
    inMemoryLogs[state.selectedDate] = updated;

    set({ entries: cloneEntries(updated) });
  },

  addImageEntry: async (imageUrl: string): Promise<void> => {
    const state = get();
    if (!imageUrl) return;

    const nextEntry: MealEntry = {
      id: makeId(),
      rawText: 'Foto enviada para analise',
      imageUrl,
      createdAt: new Date(),
      date: state.selectedDate,
      isDirty: true,
    };

    const existing = inMemoryLogs[state.selectedDate] ?? [];
    const updated = [...existing, nextEntry];
    inMemoryLogs[state.selectedDate] = updated;

    set({ entries: cloneEntries(updated) });
  },

  updateParsedResult: (entryId: string, result: MealEntry['parsedResult']): void => {
    const state = get();
    const existing = inMemoryLogs[state.selectedDate] ?? [];
    const updated = existing.map((entry) =>
      entry.id === entryId
        ? { ...entry, parsedResult: result ?? undefined, isDirty: false }
        : entry,
    );

    inMemoryLogs[state.selectedDate] = updated;
    set({ entries: cloneEntries(updated) });
  },

  removeEntry: async (entryId: string): Promise<void> => {
    const state = get();
    const existing = inMemoryLogs[state.selectedDate] ?? [];
    const updated = existing.filter((entry) => entry.id !== entryId);
    inMemoryLogs[state.selectedDate] = updated;
    set({ entries: cloneEntries(updated) });
  },

  setDate: (date: string): void => {
    const dayEntries = inMemoryLogs[date] ?? [];
    set({ selectedDate: date, entries: cloneEntries(dayEntries) });
  },
}));
