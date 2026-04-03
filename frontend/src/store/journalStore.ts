/**
 * store/journalStore.ts – Zustand store para o diário nutricional.
 *
 * Gerencia o estado das entradas de refeição (MealEntry) do dia atual
 * e a interação com o banco local (Dexie / IndexedDB).
 *
 * Responsabilidades:
 * - CRUD de MealEntry
 * - Carregar entradas do dia selecionado
 * - Persistir no IndexedDB via Dexie
 * - Marcar entradas como "dirty" quando editadas
 *
 * Biblioteca: Zustand (https://github.com/pmndrs/zustand)
 */

import { create } from 'zustand';
import type { MealEntry, DayLog } from '../types/food';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface JournalState {
  /** Data selecionada no formato YYYY-MM-DD. */
  selectedDate: string;
  /** Entradas do dia selecionado. */
  entries: MealEntry[];
  /** Se está carregando do IndexedDB. */
  isLoading: boolean;

  // Actions
  /** Carrega as entradas de uma data específica do IndexedDB. */
  loadDay: (date: string) => Promise<void>;
  /** Adiciona uma nova entrada de texto. */
  addTextEntry: (rawText: string) => Promise<void>;
  /** Adiciona uma nova entrada de foto. */
  addImageEntry: (imageUrl: string) => Promise<void>;
  /** Atualiza o resultado parsed de uma entrada. */
  updateParsedResult: (entryId: string, result: MealEntry['parsedResult']) => void;
  /** Remove uma entrada. */
  removeEntry: (entryId: string) => Promise<void>;
  /** Muda a data selecionada e recarrega. */
  setDate: (date: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useJournalStore = create<JournalState>((set, _get) => ({
  selectedDate: new Date().toISOString().slice(0, 10),
  entries: [],
  isLoading: false,

  loadDay: async (_date: string): Promise<void> => {
    // TODO: implement – ler do Dexie, filtrar por data, ordenar por createdAt
    set({ isLoading: true });
    // const entries = await db.meals.where('date').equals(date).toArray();
    set({ entries: [], isLoading: false });
  },

  addTextEntry: async (_rawText: string): Promise<void> => {
    // TODO: implement – criar MealEntry com UUID, persistir no Dexie
    throw new Error('TODO: implement addTextEntry');
  },

  addImageEntry: async (_imageUrl: string): Promise<void> => {
    // TODO: implement – criar MealEntry com imageUrl, persistir no Dexie
    throw new Error('TODO: implement addImageEntry');
  },

  updateParsedResult: (_entryId: string, _result: MealEntry['parsedResult']): void => {
    // TODO: implement – atualizar entrada e persistir
    throw new Error('TODO: implement updateParsedResult');
  },

  removeEntry: async (_entryId: string): Promise<void> => {
    // TODO: implement – remover do Dexie e do state
    throw new Error('TODO: implement removeEntry');
  },

  setDate: (date: string): void => {
    set({ selectedDate: date });
    // TODO: chamar loadDay(date) após implementar
  },
}));
