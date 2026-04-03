/**
 * services/cache.ts – Camada de cache em IndexedDB.
 *
 * Evita chamadas repetidas à API para os mesmos inputs.
 * Armazena resultados de parsing no IndexedDB (via Dexie)
 * com TTL configurável.
 *
 * Estratégia:
 * - Chave: hash do input (texto ou thumbnail da imagem)
 * - Valor: ParseResponse serializado em JSON
 * - TTL padrão: 24 horas
 */

import type { ParseResponse } from '../types/api';

/** TTL padrão do cache: 24 horas em ms. */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Gera uma chave de cache a partir de um input de texto.
 *
 * @param text - texto livre do usuário
 * @returns hash string para usar como chave
 *
 * TODO: implement – hash simples (ex.: btoa ou crypto.subtle.digest)
 */
export function generateCacheKey(_text: string): string {
  throw new Error('TODO: implement generateCacheKey');
}

/**
 * Busca um resultado cacheado no IndexedDB.
 *
 * @param key - chave de cache
 * @returns ParseResponse se encontrado e não expirado, null caso contrário
 *
 * TODO: implement – buscar no Dexie, verificar TTL
 */
export async function getCached(_key: string): Promise<ParseResponse | null> {
  throw new Error('TODO: implement getCached');
}

/**
 * Armazena um resultado no cache.
 *
 * @param key - chave de cache
 * @param response - resposta a cachear
 * @param ttlMs - TTL em milissegundos (default: 24h)
 *
 * TODO: implement – salvar no Dexie
 */
export async function setCache(
  _key: string,
  _response: ParseResponse,
  _ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  throw new Error('TODO: implement setCache');
}

/**
 * Remove entradas expiradas do cache.
 *
 * TODO: implement – query no Dexie por createdAt + ttlMs < Date.now()
 */
export async function pruneExpired(): Promise<void> {
  throw new Error('TODO: implement pruneExpired');
}
