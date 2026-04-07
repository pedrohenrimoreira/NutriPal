export type ChatRole = "user" | "assistant";
export type AiUiRole = ChatRole | "error";
export type AiMode = "chat" | "tools";

export interface ChatHistoryMessage {
  role: ChatRole;
  text: string;
}

export interface AiCitation {
  title: string;
  url: string;
  domain?: string;
}

export interface AiToolInvocation {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface AiResponsePayload {
  responseId: string;
  model: string;
  outputText: string;
  citations: AiCitation[];
  usage: AiUsage;
  toolInvocations?: AiToolInvocation[];
}

export interface UploadResponsePayload {
  id: string;
  purpose: string;
  bytes: number;
  filename: string;
  mimeType: string;
  localPath: string;
  createdAt: string;
}

export interface EmbeddingItem {
  id: string;
  input: string;
  embedding: number[];
  dimensions: number;
}

export interface EmbeddingSearchMatch {
  id: string;
  namespace: string;
  input: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  model: string;
  score: number;
}

export interface EmbeddingsEmbedResponse {
  action: "embed";
  model: string;
  items: EmbeddingItem[];
  stored: boolean;
  namespace: string;
  stats?: { count: number };
}

export interface EmbeddingsSearchResponse {
  action: "search";
  model: string;
  namespace: string;
  topK: number;
  matches: EmbeddingSearchMatch[];
}

export interface LocalAsset {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
}

export interface ChatRequestPayload {
  messages: ChatHistoryMessage[];
  systemPrompt?: string;
  model?: string;
  useWeb?: boolean;
}

export interface VisionRequestPayload {
  input?: string;
  history?: ChatHistoryMessage[];
  systemPrompt?: string;
  model?: string;
  image: LocalAsset;
}

export interface ToolChatRequestPayload {
  messages: ChatHistoryMessage[];
  systemPrompt?: string;
  model?: string;
}

export interface FileUploadRequestPayload {
  file: LocalAsset;
  purpose?: "user_data" | "assistants" | "batch" | "vision" | "fine-tune";
}

export interface EmbeddingsEmbedPayload {
  action: "embed";
  input: string | string[];
  store?: boolean;
  namespace?: string;
  metadata?: Record<string, unknown>;
  model?: string;
}

export interface EmbeddingsSearchPayload {
  action: "search";
  query: string;
  namespace?: string;
  topK?: number;
  model?: string;
}

export interface AiApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  upstreamRequestId?: string;
}

export interface AiEnvelope<T> {
  ok: boolean;
  data: T;
  requestId?: string;
  error?: AiApiErrorShape;
}

export interface AiUiMessage {
  id: string;
  role: AiUiRole;
  text: string;
  createdAt: string;
  citations?: AiCitation[];
  imageUri?: string | null;
  fileName?: string | null;
  toolInvocations?: AiToolInvocation[];
  errorCode?: string | null;
}
