import Constants from "expo-constants";
import { Platform } from "react-native";

function inferAiApiBaseUrl() {
  const fromEnv = typeof process !== "undefined"
    ? process.env?.EXPO_PUBLIC_AI_API_BASE_URL?.trim()
    : "";

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const constants = Constants;
  const hostUri =
    constants?.expoConfig?.hostUri ||
    constants?.manifest2?.extra?.expoClient?.hostUri ||
    constants?.manifest?.debuggerHost;

  if (typeof hostUri === "string" && hostUri.length > 0) {
    return `http://${hostUri.split(":")[0]}:8787`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8787";
  }

  return "http://localhost:8787";
}

export const AI_CONFIG = {
  apiBaseUrl: inferAiApiBaseUrl(),
  usdaApiKey:
    typeof process !== "undefined"
      ? (process.env?.EXPO_PUBLIC_USDA_API_KEY ?? null)
      : null,
  requestTimeoutMs: 30000,
};

export function hasAiBackendUrl() {
  return Boolean(AI_CONFIG.apiBaseUrl);
}
