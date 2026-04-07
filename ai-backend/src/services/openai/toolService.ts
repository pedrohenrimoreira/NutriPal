import type { ToolExecutionRecord } from "../../types/ai.js";
import { AppError } from "../../lib/errors.js";

const ORDER_STATUS_FIXTURES = {
  "10023": {
    orderId: "10023",
    status: "shipped",
    eta: "2026-04-08",
    carrier: "FastExpress",
    lastUpdate: "Saiu do centro de distribuicao de Sao Paulo.",
  },
  "20451": {
    orderId: "20451",
    status: "processing",
    eta: "2026-04-10",
    carrier: "Aguardando coleta",
    lastUpdate: "Pedido em separacao no centro logistico.",
  },
  "99881": {
    orderId: "99881",
    status: "delivered",
    eta: "2026-04-05",
    carrier: "MotoFlash",
    lastUpdate: "Entregue ao cliente e confirmado no app.",
  },
} as const;

const INTERNAL_KB = {
  premium: {
    area: "billing",
    summary: "Plano Premium libera IA, consultas web, upload de imagens e arquivos.",
    updatedAt: "2026-04-01",
  },
  refund: {
    area: "support",
    summary: "Pedidos pagos podem ser reembolsados em ate 7 dias se ainda nao enviados.",
    updatedAt: "2026-03-29",
  },
  onboarding: {
    area: "ops",
    summary: "Novos usuarios recebem uma rotina guiada de 3 passos com metas e primeiro registro.",
    updatedAt: "2026-03-12",
  },
} as const;

function hashCode(value: string) {
  return Array.from(value).reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) | 0, 0);
}

function buildWeather(location: string, units = "celsius") {
  const hash = Math.abs(hashCode(location));
  const celsius = 18 + (hash % 15);
  const temperature = units === "fahrenheit"
    ? Math.round((celsius * 9) / 5 + 32)
    : celsius;

  return {
    location,
    units,
    temperature,
    condition: ["sunny", "cloudy", "rainy"][hash % 3],
    humidityPct: 45 + (hash % 30),
    observationTime: new Date().toISOString(),
  };
}

function getOrderStatus(argumentsObject: Record<string, unknown>) {
  const orderId = String(argumentsObject.orderId ?? "").trim();
  if (!orderId) {
    throw new AppError(400, "INVALID_TOOL_ARGUMENTS", "orderId is required for get_order_status.");
  }

  return ORDER_STATUS_FIXTURES[orderId as keyof typeof ORDER_STATUS_FIXTURES] ?? {
    orderId,
    status: "unknown",
    eta: null,
    carrier: null,
    lastUpdate: "Nenhum pedido encontrado para esse identificador.",
  };
}

function getWeather(argumentsObject: Record<string, unknown>) {
  const location = String(argumentsObject.location ?? "").trim();
  const units = String(argumentsObject.units ?? "celsius").trim().toLowerCase();

  if (!location) {
    throw new AppError(400, "INVALID_TOOL_ARGUMENTS", "location is required for get_weather.");
  }

  return buildWeather(location, units === "fahrenheit" ? "fahrenheit" : "celsius");
}

function lookupInternalData(argumentsObject: Record<string, unknown>) {
  const topic = String(argumentsObject.topic ?? "").trim().toLowerCase();
  if (!topic) {
    throw new AppError(400, "INVALID_TOOL_ARGUMENTS", "topic is required for lookup_internal_data.");
  }

  return INTERNAL_KB[topic as keyof typeof INTERNAL_KB] ?? {
    topic,
    area: "unknown",
    summary: "Nenhum dado interno encontrado para esse topico.",
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export const toolDefinitions = [
  {
    type: "function",
    name: "get_order_status",
    description: "Busca o status mais recente de um pedido usando o identificador informado.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "Identificador do pedido, por exemplo 10023.",
        },
      },
      required: ["orderId"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_weather",
    description: "Retorna clima atual aproximado para uma localidade.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "Cidade e pais ou cidade e estado.",
        },
        units: {
          type: ["string", "null"],
          enum: ["celsius", "fahrenheit"],
          description: "Unidade de temperatura desejada.",
        },
      },
      required: ["location", "units"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "lookup_internal_data",
    description: "Consulta uma base interna simulada com politicas e dados operacionais.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Topico interno desejado, por exemplo premium, refund ou onboarding.",
        },
      },
      required: ["topic"],
      additionalProperties: false,
    },
  },
] as const;

export async function executeTool(name: string, argumentsObject: Record<string, unknown>): Promise<ToolExecutionRecord> {
  let result: unknown;

  switch (name) {
    case "get_order_status":
      result = getOrderStatus(argumentsObject);
      break;
    case "get_weather":
      result = getWeather(argumentsObject);
      break;
    case "lookup_internal_data":
      result = lookupInternalData(argumentsObject);
      break;
    default:
      throw new AppError(400, "UNSUPPORTED_TOOL", `Unsupported tool: ${name}`);
  }

  return {
    name,
    arguments: argumentsObject,
    result,
  };
}
