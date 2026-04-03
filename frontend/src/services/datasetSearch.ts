/**
 * services/datasetSearch.ts – Busca fuzzy no dataset nutricional local.
 *
 * Usa Fuse.js para encontrar alimentos no dataset TACO + USDA sem
 * nenhuma chamada de rede. Esta é a Camada 0 da arquitetura.
 *
 * Cobertura estimada: 60-70% dos alimentos do dia a dia.
 *
 * Biblioteca: Fuse.js (https://www.fusejs.io/)
 */

import type { FoodItem } from '../types/food';

// ---------------------------------------------------------------------------
// Configuração do Fuse.js
// ---------------------------------------------------------------------------

/**
 * Inicializa o índice Fuse.js a partir dos datasets JSON carregados.
 *
 * Os datasets (taco.json + usda-common.json) são importados estaticamente
 * e mesclados em um único array de FoodItem.
 *
 * @returns instância de Fuse pronta para busca
 *
 * TODO: implement – carregar JSONs, criar Fuse com keys ['name', 'aliases']
 */
export function initSearchIndex(): void {
  // Fuse options: threshold 0.3, keys: ['name', 'aliases'], includeScore: true
  throw new Error('TODO: implement initSearchIndex');
}

/**
 * Busca alimentos no dataset local por nome (fuzzy).
 *
 * @param query - texto a buscar (ex.: "arroz integral")
 * @param limit - máximo de resultados (default: 5)
 * @returns lista de FoodItems encontrados, ordenados por relevância
 *
 * TODO: implement – buscar no Fuse, retornar matches
 */
export function searchLocal(query: string, limit?: number): FoodItem[] {
  void query;
  void limit;
  // TODO: implement – Fuse.search(query).slice(0, limit).map(r => r.item)
  throw new Error('TODO: implement searchLocal');
}

/**
 * Verifica se um nome de alimento pode ser resolvido localmente.
 *
 * @param name - nome do alimento
 * @param threshold - score mínimo (default: 0.3, quanto menor mais preciso)
 * @returns o FoodItem se encontrado com confiança, ou null
 */
export function resolveLocally(name: string, threshold?: number): FoodItem | null {
  void name;
  void threshold;
  // TODO: implement – searchLocal(name, 1) e verificar score ≤ threshold
  throw new Error('TODO: implement resolveLocally');
}
