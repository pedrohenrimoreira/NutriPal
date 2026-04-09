import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { getOpenAI } from "../../lib/openai.js";
import type {
  ChatRequest,
  ToolChatRequest,
  VisionRequest,
} from "../../types/ai.js";
import { executeTool, toolDefinitions } from "./toolService.js";
import {
  buildAiTextResult,
  buildConversationInput,
  buildMessageWithImageContent,
  extractFunctionCalls,
} from "./responseUtils.js";

function buildWebTool(forceWeb: boolean) {
  return forceWeb
    ? [{ type: "web_search", external_web_access: true }]
    : [];
}

export async function createChatResponse(request: ChatRequest) {
  const openai = getOpenAI();
  const response = await openai.responses.create({
    model: request.model ?? (request.useWeb ? env.OPENAI_WEB_MODEL : env.OPENAI_DEFAULT_MODEL),
    instructions: request.systemPrompt,
    input: buildConversationInput(request.messages),
    tools: buildWebTool(Boolean(request.useWeb)),
    tool_choice: request.useWeb ? "auto" : undefined,
  } as any);

  return buildAiTextResult(response);
}

export async function createVisionResponse(
  request: VisionRequest,
  file: Express.Multer.File,
) {
  const openai = getOpenAI();
  const imageDataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const history = buildConversationInput(request.history ?? []);
  const prompt = request.input?.trim() || "Analyze this image.";

  const response = await openai.responses.create({
    model: request.model ?? env.OPENAI_VISION_MODEL,
    instructions: request.systemPrompt,
    input: [
      ...history,
      buildMessageWithImageContent(prompt, imageDataUrl),
    ],
  } as any);

  return buildAiTextResult(response);
}

export async function createToolChatResponse(request: ToolChatRequest) {
  const openai = getOpenAI();
  let response = await openai.responses.create({
    model: request.model ?? env.OPENAI_TOOL_MODEL,
    instructions: request.systemPrompt,
    input: buildConversationInput(request.messages),
    tools: toolDefinitions,
    tool_choice: "auto",
    parallel_tool_calls: false,
  } as any);

  const toolInvocations = [];

  for (let step = 0; step < 5; step += 1) {
    const functionCalls = extractFunctionCalls(response);

    if (functionCalls.length === 0) {
      return buildAiTextResult(response, toolInvocations);
    }

    const outputs = [];

    for (const call of functionCalls) {
      let argumentsObject: Record<string, unknown> = {};

      try {
        argumentsObject = call.argumentsJson ? JSON.parse(call.argumentsJson) : {};
      } catch {
        throw new AppError(400, "INVALID_TOOL_ARGUMENTS", `Invalid JSON for tool ${call.name}.`);
      }

      const invocation = await executeTool(call.name, argumentsObject);
      toolInvocations.push(invocation);

      outputs.push({
        type: "function_call_output",
        call_id: call.callId,
        output: JSON.stringify(invocation.result),
      });
    }

    logger.info("tool.execution.completed", {
      toolCount: outputs.length,
      responseId: response.id,
    });

    response = await openai.responses.create({
      model: request.model ?? env.OPENAI_TOOL_MODEL,
      previous_response_id: response.id,
      input: outputs,
    } as any);
  }

  throw new AppError(502, "TOOL_LOOP_EXCEEDED", "Tool loop exceeded the maximum number of steps.");
}
