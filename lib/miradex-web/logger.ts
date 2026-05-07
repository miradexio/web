import type { Logger } from "@miradexio/client";

const DEFAULT_PREFIX = "[miradex]";

// Append swapId when present so concurrent engines (multiple keystores,
// sweep + new swap in the same tab) produce visually-separable log streams.
function formatPrefix(basePrefix: string, data: unknown): string {
  if (typeof data !== "object" || data === null) return basePrefix;
  const swapId = (data as { swapId?: unknown }).swapId;
  if (typeof swapId !== "string" || swapId.length === 0) return basePrefix;
  return `${basePrefix} [${swapId}]`;
}

export function createConsoleLogger(prefix: string = DEFAULT_PREFIX): Logger {
  return {
    debug(data, message): void {
      console.debug(formatPrefix(prefix, data), message, data);
    },
    info(data, message): void {
      console.info(formatPrefix(prefix, data), message, data);
    },
    warn(data, message): void {
      console.warn(formatPrefix(prefix, data), message, data);
    },
    error(data, message): void {
      console.error(formatPrefix(prefix, data), message, data);
    },
  };
}

export const consoleLogger: Logger = createConsoleLogger();
