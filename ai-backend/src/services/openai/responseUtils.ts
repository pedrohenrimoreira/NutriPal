import { URL } from "node:url";
import type { ChatMessage, Citation, ToolExecutionRecord, UsageSummary } from "../../types/ai.js";

export function buildConversationInput(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: [{ type: "input_text", text: message.text }],
  }));
}

export function buildMessageWithImageContent(inputText: string, imageDataUrl: string) {
  return {
    role: "user",
    content: [
      { type: "input_text", text: inputText },
      { type: "input_image", image_url: imageDataUrl },
    ],
  };
}

export function extractOutputText(response: any) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const chunks: string[] = [];

  for (const item of response?.output ?? []) {
    if (item?.type !== "message") continue;

    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

export function extractUsage(response: any): UsageSummary {
  const usage = response?.usage ?? {};
  const inputTokens = Number(usage?.input_tokens ?? 0) || undefined;
  const outputTokens = Number(usage?.output_tokens ?? 0) || undefined;
  const totalTokens = Number(usage?.total_tokens ?? 0) || undefined;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

export function extractCitations(response: any): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];

  for (const item of response?.output ?? []) {
    if (item?.type !== "message") continue;

    for (const content of item?.content ?? []) {
      if (content?.type !== "output_text") continue;

      for (const annotation of content?.annotations ?? []) {
        if (annotation?.type !== "url_citation" || !annotation?.url) continue;

        const key = `${annotation.title ?? ""}:${annotation.url}`;
        if (seen.has(key)) continue;
        seen.add(key);

        let domain = "";
        try {
          domain = new URL(annotation.url).hostname.replace(/^www\./, "");
        } catch {}

        citations.push({
          title: annotation.title || annotation.url,
          url: annotation.url,
          domain,
        });
      }
    }
  }

  return citations;
}

export function extractFunctionCalls(response: any) {
  return (response?.output ?? [])
    .filter((item: any) => item?.type === "function_call")
    .map((item: any) => ({
      callId: item.call_id as string,
      name: item.name as string,
      argumentsJson: item.arguments as string,
    }));
}

export function buildAiTextResult(
  response: any,
  toolInvocations?: ToolExecutionRecord[],
) {
  return {
    responseId: response.id,
    model: response.model,
    outputText: extractOutputText(response),
    citations: extractCitations(response),
    usage: extractUsage(response),
    toolInvocations,
  };
}
