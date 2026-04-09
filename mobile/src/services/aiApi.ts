import Constants from "expo-constants";
import { Platform } from "react-native";
import type {
  AiEnvelope,
  AiResponsePayload,
  ChatRequestPayload,
  EmbeddingsEmbedPayload,
  EmbeddingsEmbedResponse,
  EmbeddingsSearchPayload,
  EmbeddingsSearchResponse,
  FileUploadRequestPayload,
  LocalAsset,
  ToolChatRequestPayload,
  UploadResponsePayload,
  VisionRequestPayload,
} from "../types/ai";

const DEFAULT_TIMEOUT_MS = 30000;

function inferHostFromExpo() {
  const constants = Constants as any;
  const hostUri =
    Constants.expoConfig?.hostUri ||
    constants?.manifest2?.extra?.expoClient?.hostUri ||
    constants?.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== "string") {
    return null;
  }

  return hostUri.split(":")[0];
}

export function getAiApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_AI_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const expoHost = inferHostFromExpo();
  if (expoHost) {
    return `http://${expoHost}:8787`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8787";
  }

  return "http://localhost:8787";
}

export class AiApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  requestId?: string;
  upstreamRequestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string,
    upstreamRequestId?: string,
  ) {
    super(message);
    this.name = "AiApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.upstreamRequestId = upstreamRequestId;
  }
}

function inferFileName(asset: LocalAsset) {
  if (asset.name?.trim()) {
    return asset.name.trim();
  }

  const parts = asset.uri.split("/").filter(Boolean);
  return parts[parts.length - 1] || "upload";
}

function inferMimeType(asset: LocalAsset, fallback: string) {
  if (asset.type?.trim()) {
    return asset.type.trim();
  }

  const fileName = inferFileName(asset).toLowerCase();
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".webp")) return "image/webp";
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".csv")) return "text/csv";
  if (fileName.endsWith(".md")) return "text/markdown";
  if (fileName.endsWith(".json")) return "application/json";
  if (fileName.endsWith(".txt")) return "text/plain";
  return fallback;
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${getAiApiBaseUrl()}${path}`;

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(init.headers ?? {}),
      },
    });

    const requestId = response.headers.get("x-request-id") ?? undefined;
    const payload = await response.json().catch(() => null) as AiEnvelope<T> | null;

    if (!response.ok || !payload?.ok) {
      const error = payload?.error;
      const fallbackMessage = response.status === 404
        ? `Endpoint de IA nao encontrado em ${url}.`
        : `Request failed with status ${response.status}.`;
      throw new AiApiError(
        response.status,
        error?.code ?? "REQUEST_FAILED",
        error?.message ?? fallbackMessage,
        error?.details,
        error?.requestId ?? requestId,
        error?.upstreamRequestId,
      );
    }

    return payload.data;
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new AiApiError(
        408,
        "REQUEST_TIMEOUT",
        `A requisicao para o backend de IA expirou em ${url}.`,
      );
    }

    if (error instanceof AiApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AiApiError(
      503,
      "BACKEND_UNREACHABLE",
      `Nao foi possivel conectar ao backend de IA em ${url}. Verifique se o ai-backend esta rodando.`,
      { cause: message },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function appendAsset(formData: FormData, fieldName: string, asset: LocalAsset, fallbackMimeType: string) {
  (formData as any).append(fieldName, {
    uri: asset.uri,
    name: inferFileName(asset),
    type: inferMimeType(asset, fallbackMimeType),
  });
}

export async function chat(payload: ChatRequestPayload) {
  return requestJson<AiResponsePayload>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function webChat(payload: ChatRequestPayload) {
  return requestJson<AiResponsePayload>("/ai/web-chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function toolChat(payload: ToolChatRequestPayload) {
  return requestJson<AiResponsePayload>("/ai/tool-chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function vision(payload: VisionRequestPayload) {
  const formData = new FormData();

  if (payload.input) {
    formData.append("input", payload.input);
  }
  if (payload.systemPrompt) {
    formData.append("systemPrompt", payload.systemPrompt);
  }
  if (payload.model) {
    formData.append("model", payload.model);
  }
  if (payload.history?.length) {
    formData.append("history", JSON.stringify(payload.history));
  }

  appendAsset(formData, "image", payload.image, "image/jpeg");

  return requestJson<AiResponsePayload>("/ai/vision", {
    method: "POST",
    body: formData,
  });
}

export async function uploadFile(payload: FileUploadRequestPayload) {
  const formData = new FormData();
  formData.append("purpose", payload.purpose ?? "user_data");
  appendAsset(formData, "file", payload.file, "application/octet-stream");

  return requestJson<UploadResponsePayload>("/ai/files", {
    method: "POST",
    body: formData,
  });
}

export async function createEmbeddings(payload: EmbeddingsEmbedPayload | EmbeddingsSearchPayload) {
  return requestJson<EmbeddingsEmbedResponse | EmbeddingsSearchResponse>("/ai/embeddings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
