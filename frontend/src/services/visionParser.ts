/**
 * services/visionParser.ts – Cliente HTTP para o endpoint /parse/image do backend.
 *
 * Converte uma imagem para base64 e envia ao pipeline de visão
 * computacional do backend (SAM 2 → YOLO → Depth → Volume → Nutrição).
 *
 * Endpoint: POST /parse/image
 */

import type { ImageParseRequest, ParseResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * Converte um Blob de imagem para string base64.
 *
 * @param blob - imagem capturada
 * @returns string base64 (sem prefixo data:...)
 *
 * TODO: implement – usar FileReader ou arrayBuffer
 */
export function blobToBase64(_blob: Blob): Promise<string> {
  // TODO: implement
  throw new Error('TODO: implement blobToBase64');
}

/**
 * Envia uma imagem ao backend para parsing nutricional via visão computacional.
 *
 * @param imageBlob - imagem capturada pela câmera
 * @param hasReferenceObject - se há objeto de referência na imagem
 * @param referenceDescription - descrição do objeto (ex.: "moeda de R$1")
 * @returns resposta com itens identificados e nutrição estimada
 *
 * TODO: implement – converter para base64, POST para API_URL + '/parse/image'
 */
export async function parseImage(
  imageBlob: Blob,
  hasReferenceObject = false,
  referenceDescription?: string,
): Promise<ParseResponse> {
  void imageBlob;
  void hasReferenceObject;
  void referenceDescription;
  void API_URL;

  const _body: ImageParseRequest = {
    image_base64: '', // TODO: await blobToBase64(imageBlob)
    mime_type: imageBlob.type,
    has_reference_object: hasReferenceObject,
    reference_object_description: referenceDescription,
  };

  // TODO: implement – fetch POST
  throw new Error('TODO: implement parseImage');
}
