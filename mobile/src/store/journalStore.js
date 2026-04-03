/**
 * Journal store using zustand
 * Manages meal entries and daily totals
 */
import { useState, useCallback } from "react";

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// Simple in-memory store with React state (Phase 2: AsyncStorage persistence)
let _entries = {};
let _listeners = [];

function notify() {
  _listeners.forEach((fn) => fn());
}

// Helper function to update parsed result
function _updateParsedResult(id, result, forceRenderFn) {
  const day = Object.keys(_entries).find((d) =>
    _entries[d].some((e) => e.id === id),
  );
  if (!day) return;
  _entries[day] = _entries[day].map((e) =>
    e.id === id ? { ...e, parsedResult: result, isProcessing: false } : e,
  );
  notify();
  forceRenderFn((n) => n + 1);
}

export function useJournalStore() {
  const [, forceRender] = useState(0);
  const today = toDateStr(new Date());
  const [selectedDate, setSelectedDateState] = useState(today);

  const subscribe = useCallback((fn) => {
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  }, []);

  const entries = _entries[selectedDate] ?? [];

  const setDate = useCallback((date) => {
    setSelectedDateState(date);
  }, []);

  const addTextEntry = useCallback(
    async (rawText) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        rawText,
        isProcessing: true,
      };
      _entries[selectedDate] = [...(_entries[selectedDate] ?? []), entry];
      notify();
      forceRender((n) => n + 1);

      // TODO: Call API to parse nutrition data
      // Simulate processing
      setTimeout(() => {
        _updateParsedResult(
          entry.id,
          {
            items: [
              {
                name: rawText,
                quantity_g: 100,
                calories: 200,
                protein_g: 10,
                carbs_g: 30,
                fat_g: 5,
                confidence: 0.8,
              },
            ],
            totals: { calories: 200, protein_g: 10, carbs_g: 30, fat_g: 5 },
          },
          forceRender,
        );
      }, 1500);

      return entry.id;
    },
    [selectedDate],
  );

  const addImageEntry = useCallback(
    async (imageUri) => {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        imageUri,
        isProcessing: true,
      };
      _entries[selectedDate] = [...(_entries[selectedDate] ?? []), entry];
      notify();
      forceRender((n) => n + 1);
      return entry.id;
    },
    [selectedDate],
  );

  const updateParsedResult = useCallback((id, result) => {
    _updateParsedResult(id, result, forceRender);
  }, []);

  const removeEntry = useCallback((id) => {
    const day = Object.keys(_entries).find((d) =>
      _entries[d].some((e) => e.id === id),
    );
    if (!day) return;
    _entries[day] = _entries[day].filter((e) => e.id !== id);
    notify();
    forceRender((n) => n + 1);
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

/**
 * Hook to calculate daily totals
 */
export function useDailyTotals(entries) {
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
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}
