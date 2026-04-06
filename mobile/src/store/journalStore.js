/**
 * Journal store using zustand.
 * Manages meal entries and daily totals.
 */
import { useState, useCallback } from "react";
import { estimateNutritionFromText } from "../utils/nutrition";
import { useSettingsStore } from "./settingsStore";
import { analyzeTextEntry, analyzeImageEntry } from "../services/gemini";

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

let _entries = {};
let _listeners = [];
let _analysisVersions = {};

export function getEntriesForDate(date) {
  return _entries[date] ?? [];
}

function notify() {
  _listeners.forEach((fn) => fn());
}

function makeImageAsset(imageInput) {
  if (typeof imageInput === "string") {
    return { uri: imageInput };
  }

  if (!imageInput || typeof imageInput !== "object") {
    return null;
  }

  const uri = typeof imageInput.uri === "string" ? imageInput.uri.trim() : "";
  if (!uri) {
    return null;
  }

  return {
    uri,
    fileName: typeof imageInput.fileName === "string" ? imageInput.fileName : undefined,
    mimeType: typeof imageInput.mimeType === "string" ? imageInput.mimeType : undefined,
    fileSize: typeof imageInput.fileSize === "number" ? imageInput.fileSize : undefined,
    width: typeof imageInput.width === "number" ? imageInput.width : undefined,
    height: typeof imageInput.height === "number" ? imageInput.height : undefined,
    source: typeof imageInput.source === "string" ? imageInput.source : undefined,
  };
}

function _updateParsedResult(id, result, forceRenderFn, version) {
  if (version !== undefined && _analysisVersions[id] !== version) return;
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
      const trimmed = rawText.trim();
      if (!trimmed) return null;

      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        rawText: trimmed,
        isProcessing: true,
      };
      _entries[selectedDate] = [...(_entries[selectedDate] ?? []), entry];
      notify();
      forceRender((n) => n + 1);

      const savedMeals = useSettingsStore.getState().savedMeals;
      const fallbackFn = (text) => estimateNutritionFromText(text, savedMeals);

      analyzeTextEntry(trimmed, fallbackFn).then((parsed) => {
        _updateParsedResult(entry.id, parsed, forceRender);
      });

      return entry.id;
    },
    [selectedDate],
  );

  const addImageEntry = useCallback(
    async (imageInput) => {
      const imageAsset = makeImageAsset(imageInput);
      if (!imageAsset?.uri) return null;

      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        rawText: "",
        imageUri: imageAsset.uri,
        imageAsset,
        image: imageAsset,
        isProcessing: true,
      };
      _entries[selectedDate] = [...(_entries[selectedDate] ?? []), entry];
      notify();
      forceRender((n) => n + 1);

      analyzeImageEntry(imageAsset.uri).then((parsed) => {
        _updateParsedResult(entry.id, parsed, forceRender);
      });

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

  const editEntry = useCallback(async (id, rawText) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const day = Object.keys(_entries).find((d) =>
      _entries[d].some((e) => e.id === id),
    );
    if (!day) return;

    const version = (_analysisVersions[id] ?? 0) + 1;
    _analysisVersions[id] = version;

    _entries[day] = _entries[day].map((e) =>
      e.id === id
        ? { ...e, rawText: trimmed, parsedResult: undefined, isProcessing: true }
        : e,
    );
    notify();
    forceRender((n) => n + 1);

    const savedMeals = useSettingsStore.getState().savedMeals;
    const fallbackFn = (text) => estimateNutritionFromText(text, savedMeals);

    analyzeTextEntry(trimmed, fallbackFn).then((parsed) => {
      _updateParsedResult(id, parsed, forceRender, version);
    });
  }, []);

  return {
    entries,
    selectedDate,
    setDate,
    addTextEntry,
    addImageEntry,
    updateParsedResult,
    removeEntry,
    editEntry,
    subscribe,
  };
}

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
