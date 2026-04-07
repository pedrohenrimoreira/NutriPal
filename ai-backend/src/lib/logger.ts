import { env } from "../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel) {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[env.LOG_LEVEL];
}

function sanitizeMeta(meta?: Record<string, unknown>) {
  if (!meta) return undefined;

  const copy: Record<string, unknown> = {};
  Object.entries(meta).forEach(([key, value]) => {
    if (/api[_-]?key|authorization|token/i.test(key)) {
      copy[key] = "[redacted]";
      return;
    }

    if (value instanceof Error) {
      copy[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
      return;
    }

    copy[key] = value;
  });

  return copy;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeMeta(meta),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    write("debug", message, meta);
  },
  info(message: string, meta?: Record<string, unknown>) {
    write("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    write("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    write("error", message, meta);
  },
};
