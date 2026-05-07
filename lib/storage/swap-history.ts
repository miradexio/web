import {
  listSwapHistory,
  patchSwapHistory,
  persistSwapHistory,
  readSwapHistory,
  removeSwapHistory,
  type SwapHistoryRow,
} from "@/lib/miradex-web/idb";

export type { SwapHistoryRow };

export const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  "completed",
  "failed",
  "refunded",
  "expired",
  "cancelled",
  "punished",
]);

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.has(status);
}

export async function saveSwapHistory(row: SwapHistoryRow): Promise<void> {
  await persistSwapHistory(row);
}

export async function updateSwapHistory(
  flowId: string,
  patch: Partial<SwapHistoryRow>,
): Promise<SwapHistoryRow | null> {
  return patchSwapHistory(flowId, patch);
}

export async function loadSwapHistory(): Promise<readonly SwapHistoryRow[]> {
  return listSwapHistory();
}

export async function loadSwapHistoryEntry(flowId: string): Promise<SwapHistoryRow | null> {
  return readSwapHistory(flowId);
}

export async function deleteSwapHistory(flowId: string): Promise<void> {
  await removeSwapHistory(flowId);
}
