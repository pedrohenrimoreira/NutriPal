/**
 * services/nutritionRouter.ts – Router de camada nutricional.
 *
 * Decide qual camada usar para resolver cada alimento:
 *
 * Camada 0: Dataset local (TACO + USDA) via datasetSearch – custo zero.
 * Camada 1: LLM barato (Haiku / Gemini Flash) – para itens não resolvidos.
 * Camada 2: LLM médio (Sonnet / Gemini Pro) – para pratos complexos.
 * Camada 3: Pipeline de visão completo – para fotos.
 *
 * O router é o cérebro que minimiza custos: tenta resolver tudo
 * localmente antes de escalar para APIs pagas.
 */

import type { ParsedNutrition } from '../types/food';

/**
 * Processa uma entrada de texto livre e retorna a nutrição estimada.
 *
 * Fluxo:
 * 1. Tokeniza o texto em itens individuais
 * 2. Tenta resolver cada item via datasetSearch (Camada 0)
 * 3. Itens não resolvidos são agrupados e enviados ao backend /parse/text
 * 4. Mescla resultados locais com resultados da API
 *
 * @param rawText - texto livre do usuário
 * @returns resultado consolidado
 *
 * TODO: implement
 */
export async function routeTextInput(rawText: string): Promise<ParsedNutrition> {
  void rawText;
  throw new Error('TODO: implement routeTextInput');
}

/**
 * Processa uma entrada de foto e retorna a nutrição estimada.
 *
 * Fluxo:
 * 1. Codifica a imagem em base64
 * 2. Envia ao backend /parse/image (pipeline completo de visão)
 * 3. Converte a resposta para ParsedNutrition
 *
 * @param imageBlob - imagem capturada pela câmera
 * @param hasReference - se há objeto de referência na foto
 * @param referenceDesc - descrição do objeto de referência
 * @returns resultado da visão
 *
 * TODO: implement
 */
export async function routeImageInput(
  imageBlob: Blob,
  hasReference: boolean,
  referenceDesc?: string,
): Promise<ParsedNutrition> {
  void imageBlob;
  void hasReference;
  void referenceDesc;
  throw new Error('TODO: implement routeImageInput');
}
