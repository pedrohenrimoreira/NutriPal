import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { openai } from "../../lib/openai.js";
import type {
  EmbeddingsRequest,
  StoredEmbeddingRecord,
} from "../../types/ai.js";
import {
  addToSemanticIndex,
  getSemanticIndexStats,
  searchSemanticIndex,
} from "../storage/semanticIndexStore.js";

export async function handleEmbeddingsRequest(request: EmbeddingsRequest) {
  if (request.action === "embed") {
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const response = await openai.embeddings.create({
      model: request.model ?? env.OPENAI_EMBEDDING_MODEL,
      input: inputs,
      encoding_format: "float",
    });

    const items = response.data.map((item, index) => ({
      id: randomUUID(),
      input: inputs[index],
      embedding: item.embedding,
      dimensions: item.embedding.length,
    }));

    if (request.store) {
      const records: StoredEmbeddingRecord[] = items.map((item) => ({
        id: item.id,
        namespace: request.namespace,
        input: item.input,
        embedding: item.embedding,
        metadata: request.metadata,
        createdAt: new Date().toISOString(),
        model: request.model ?? env.OPENAI_EMBEDDING_MODEL,
      }));

      await addToSemanticIndex(records);
    }

    const stats = request.store
      ? await getSemanticIndexStats(request.namespace)
      : undefined;

    return {
      action: "embed" as const,
      model: request.model ?? env.OPENAI_EMBEDDING_MODEL,
      items,
      stored: request.store,
      namespace: request.namespace,
      stats,
    };
  }

  const queryEmbedding = await openai.embeddings.create({
    model: request.model ?? env.OPENAI_EMBEDDING_MODEL,
    input: request.query,
    encoding_format: "float",
  });

  const matches = await searchSemanticIndex(
    queryEmbedding.data[0].embedding,
    request.namespace,
    request.topK,
  );

  return {
    action: "search" as const,
    model: request.model ?? env.OPENAI_EMBEDDING_MODEL,
    namespace: request.namespace,
    topK: request.topK,
    matches,
  };
}
