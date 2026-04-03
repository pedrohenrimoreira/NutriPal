import {useState, useCallback} from 'react';
import type {MealEntry, ParsedResult} from '../types';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Simple in-memory store with React state (Phase 2: AsyncStorage persistence)
let _entries: Record<string, MealEntry[]> = {};
let _listeners: (() => void)[] = [];

function notify() {
  _listeners.forEach(fn => fn());
}

export function useJournalStore() {
  const [, forceRender] = useState(0);
  const today = toDateStr(new Date());
  const [selectedDate, setSelectedDateState] = useState(today);

  const subscribe = useCallback((fn: () => void) => {
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter(l => l !== fn);
    };
  }, []);

  const entries: MealEntry[] = _entries[selectedDate] ?? [];

  const setDate = useCallback((date: string) => {
    setSelectedDateState(date);
  }, []);

  const addTextEntry = useCallback(async (rawText: string) => {
    const entry: MealEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: selectedDate,
      createdAt: new Date().toISOString(),
      rawText,
      isProcessing: true,
    };
    _entries[selectedDate] = [...(_entries[selectedDate] ?? []), entry];
    notify();
    forceRender(n => n + 1);
    return entry.id;
  }, [selectedDate]);

  const addImageEntry = useCallback(async (imageUri: string) => {
    const entry: MealEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: selectedDate,
      createdAt: new Date().toISOString(),
      imageUri,
      isProcessing: true,
    };
    _entries[selectedDate] = [...(_entries[selectedDate] ?? []), entry];
    notify();
    forceRender(n => n + 1);
    return entry.id;
  }, [selectedDate]);

  const updateParsedResult = useCallback((id: string, result: ParsedResult) => {
    const day = Object.keys(_entries).find(d =>
      _entries[d].some(e => e.id === id),
    );
    if (!day) return;
    _entries[day] = _entries[day].map(e =>
      e.id === id ? {...e, parsedResult: result, isProcessing: false} : e,
    );
    notify();
    forceRender(n => n + 1);
  }, []);

  const removeEntry = useCallback((id: string) => {
    const day = Object.keys(_entries).find(d =>
      _entries[d].some(e => e.id === id),
    );
    if (!day) return;
    _entries[day] = _entries[day].filter(e => e.id !== id);
    notify();
    forceRender(n => n + 1);
  }, []);

  return {
    entries,
    selectedDate,
    setDate,
    addTextEntry,
    addImageEntry,
    updateParsedResult,
    removeEntry,
    subscribe,
  };
}

export function useDailyTotals(entries: MealEntry[]) {
  return entries.reduce(
    (acc, entry) => {
      if (entry.parsedResult) {
        return {
          calories: acc.calories + entry.parsedResult.totals.calories,
          protein_g: acc.protein_g + entry.parsedResult.totals.protein_g,
          carbs_g: acc.carbs_g + entry.parsedResult.totals.carbs_g,
          fat_g: acc.fat_g + entry.parsedResult.totals.fat_g,
        };
      }
      return acc;
    },
    {calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0},
  );
}
