/**
 * services/textParser.ts – Cliente HTTP para o endpoint /parse/text do backend.
 *
 * Envia texto livre ao backend FastAPI e recebe ParseResponse.
 * Usado quando o nutritionRouter determina que há itens não resolvíveis localmente.
 *
 * Endpoint: POST /parse/text
 */

import type { TextParseRequest, ParseResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * Envia texto livre ao backend para parsing nutricional via LLM.
 *
 * @param text - texto livre do usuário
 * @param language - idioma (default: 'pt-BR')
 * @returns resposta do backend com itens parseados
 *
 * TODO: implement – fetch POST para API_URL + '/parse/text'
 */
export async function parseText(text: string, language = 'pt-BR'): Promise<ParseResponse> {
  const _body: TextParseRequest = { text, language };
  void _body;
  void API_URL;
  // TODO: implement
  // const res = await fetch(`${API_URL}/parse/text`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(body),
  // });
  // return res.json();
  throw new Error('TODO: implement parseText');
}
