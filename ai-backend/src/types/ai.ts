import { z } from "zod";

export const ChatMessageRoleSchema = z.enum(["user", "assistant"]);

export const ChatMessageSchema = z.object({
  role: ChatMessageRoleSchema,
  text: z.string().trim().min(1).max(8000),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(24),
  systemPrompt: z.string().trim().max(6000).optional(),
  model: z.string().trim().max(120).optional(),
  useWeb: z.boolean().optional().default(false),
});

export const VisionRequestSchema = z.object({
  input: z.string().trim().max(6000).optional(),
  history: z.array(ChatMessageSchema).max(16).optional().default([]),
  systemPrompt: z.string().trim().max(6000).optional(),
  model: z.string().trim().max(120).optional(),
});

export const ToolChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(24),
  systemPrompt: z.string().trim().max(6000).optional(),
  model: z.string().trim().max(120).optional(),
});

export const FilePurposeSchema = z.enum([
  "user_data",
  "assistants",
  "batch",
  "vision",
  "fine-tune",
]);

export const FileUploadRequestSchema = z.object({
  purpose: FilePurposeSchema.optional().default("user_data"),
});

export const EmbeddingsEmbedRequestSchema = z.object({
  action: z.literal("embed"),
  input: z.union([
    z.string().trim().min(1).max(8000),
    z.array(z.string().trim().min(1).max(8000)).min(1).max(32),
  ]),
  store: z.boolean().optional().default(false),
  namespace: z.string().trim().min(1).max(100).optional().default("default"),
  metadata: z.record(z.string(), z.unknown()).optional(),
  model: z.string().trim().max(120).optional(),
});

export const EmbeddingsSearchRequestSchema = z.object({
  action: z.literal("search"),
  query: z.string().trim().min(1).max(8000),
  namespace: z.string().trim().min(1).max(100).optional().default("default"),
  topK: z.coerce.number().int().min(1).max(20).optional().default(5),
  model: z.string().trim().max(120).optional(),
});

export const EmbeddingsRequestSchema = z.discriminatedUnion("action", [
  EmbeddingsEmbedRequestSchema,
  EmbeddingsSearchRequestSchema,
]);

export interface Citation {
  title: string;
  url: string;
  domain: string;
}

export interface UsageSummary {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface ToolExecutionRecord {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export interface AiTextResult {
  responseId: string;
  model: string;
  outputText: string;
  citations: Citation[];
  usage: UsageSummary;
  toolInvocations?: ToolExecutionRecord[];
}

export interface StoredEmbeddingRecord {
  id: string;
  namespace: string;
  input: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  model: string;
}

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type VisionRequest = z.infer<typeof VisionRequestSchema>;
export type ToolChatRequest = z.infer<typeof ToolChatRequestSchema>;
export type FileUploadRequest = z.infer<typeof FileUploadRequestSchema>;
export type EmbeddingsRequest = z.infer<typeof EmbeddingsRequestSchema>;
