/**
 * db/schema.ts – Schema do IndexedDB via Dexie.js.
 *
 * O NutriLens usa IndexedDB (via Dexie) para persistência offline-first:
 * - Entradas de refeição do diário
 * - Cache de resultados de parsing (evita re-chamadas)
 * - Dados do dataset local (TACO/USDA) em formato indexado
 *
 * Biblioteca: Dexie.js v4 (https://dexie.org/)
 */

import Dexie, { type Table } from 'dexie';
import type { MealEntry, FoodItem } from '../types/food';

// ---------------------------------------------------------------------------
// Interface de cache
// ---------------------------------------------------------------------------

/** Entrada de cache para resultados de parsing. */
export interface CacheEntry {
  /** Hash do input (texto ou imagem thumbnail). */
  key: string;
  /** Resposta JSON serializado. */
  responseJson: string;
  /** Timestamp de criação. */
  createdAt: Date;
  /** TTL em milissegundos. */
  ttlMs: number;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export class NutriLensDB extends Dexie {
  meals!: Table<MealEntry, string>;
  foods!: Table<FoodItem, string>;
  cache!: Table<CacheEntry, string>;

  constructor() {
    super('nutrilens');

    // TODO: definir índices após finalizar os schemas
    this.version(1).stores({
      meals: 'id, date, createdAt',
      foods: 'id, name, source, *aliases',
      cache: 'key, createdAt',
    });
  }
}

/** Instância singleton do banco. */
export const db = new NutriLensDB();
