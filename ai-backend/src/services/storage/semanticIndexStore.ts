import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";
import type { StoredEmbeddingRecord } from "../../types/ai.js";

async function ensureIndexFile() {
  await mkdir(path.dirname(env.semanticIndexFile), { recursive: true });

  try {
    await readFile(env.semanticIndexFile, "utf8");
  } catch {
    await writeFile(env.semanticIndexFile, "[]", "utf8");
  }
}

async function readIndex() {
  await ensureIndexFile();
  const raw = await readFile(env.semanticIndexFile, "utf8");
  return JSON.parse(raw) as StoredEmbeddingRecord[];
}

async function writeIndex(records: StoredEmbeddingRecord[]) {
  await ensureIndexFile();
  await writeFile(env.semanticIndexFile, JSON.stringify(records, null, 2), "utf8");
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }

  if (!leftNorm || !rightNorm) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export async function addToSemanticIndex(records: StoredEmbeddingRecord[]) {
  const current = await readIndex();
  current.push(...records);
  await writeIndex(current);
}

export async function searchSemanticIndex(
  queryEmbedding: number[],
  namespace: string,
  topK: number,
) {
  const current = await readIndex();

  return current
    .filter((record) => record.namespace === namespace)
    .map((record) => ({
      ...record,
      score: cosineSimilarity(queryEmbedding, record.embedding),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}

export async function getSemanticIndexStats(namespace: string) {
  const current = await readIndex();
  const count = current.filter((record) => record.namespace === namespace).length;
  return { count };
}
