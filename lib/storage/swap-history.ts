import type { EngineState } from "@miradexio/client";
import {
  listSwapHistory,
  patchSwapHistory,
  persistSwapHistory,
  readSwapHistory,
  removeSwapHistory,
  type SwapHistoryRow,
} from "@/lib/miradex-web/idb";

export type { SwapHistoryRow };

export interface SyncSnapshot {
  readonly status: string;
  readonly expiresAt: string | null;
  readonly depositAddress: string | null;
  readonly destAddress: string | null;
  readonly outputTxHash: string | null;
  readonly serverSwapId: string | null;
}

export function extractSnapshot(state: EngineState): SyncSnapshot {
  const flow = state.activeFlow === "atomic" ? state.atomic : state.swap;
  const snapshot = "snapshot" in flow ? flow.snapshot : null;
  const outputTxHash =
    "outputTxHash" in flow && typeof flow.outputTxHash === "string" ? flow.outputTxHash : null;
  const serverSwapId =
    state.atomic.snapshot?.swapId ?? state.swap.snapshot?.swapId ?? null;
  return {
    status: flow.phase,
    expiresAt: snapshot?.expiresAt ?? null,
    depositAddress: snapshot?.depositAddr ?? null,
    destAddress: snapshot?.destAddress ?? null,
    outputTxHash,
    serverSwapId,
  };
}

export function snapshotsEqual(prev: SwapHistoryRow, next: SyncSnapshot): boolean {
  return (
    prev.status === next.status &&
    prev.expiresAt === next.expiresAt &&
    prev.depositAddress === next.depositAddress &&
    prev.outputTxHash === next.outputTxHash &&
    // serverSwapId and destAddress are monotonic: once set, a null in a later
    // snapshot never clears the stored value.
    (next.serverSwapId === null || prev.serverSwapId === next.serverSwapId) &&
    (next.destAddress === null || prev.destAddress === next.destAddress)
  );
}

// Build the initial atomic-flow row when its serverSwapId arrives. Atomic
// flows are always BTC->XMR via atomicswap, so coin/network/provider are fixed.
export function buildAtomicHistoryRow(
  flowId: string,
  state: EngineState,
  next: SyncSnapshot,
): SwapHistoryRow | null {
  if (next.serverSwapId === null) return null;
  const snap = state.atomic.snapshot;
  return {
    flowId,
    serverSwapId: next.serverSwapId,
    createdAt: new Date().toISOString(),
    fromCoin: "BTC",
    fromNetwork: "BTC",
    fromAmount: snap?.depositAmount ?? "0",
    fromAmountUsd: snap?.amountInUsd ?? null,
    toCoin: "XMR",
    toNetwork: "XMR",
    toAmount: snap?.expectedOut ?? "0",
    toAmountUsd: snap?.expectedOutUsd ?? null,
    provider: "atomicswap",
    status: next.status,
    expiresAt: next.expiresAt,
    depositAddress: next.depositAddress,
    destAddress: next.destAddress,
    outputTxHash: next.outputTxHash,
  };
}

export interface CreatedSwapInfo {
  readonly flowId: string;
  readonly fromCoin: string;
  readonly fromNetwork: string;
  readonly fromAmount: string;
  readonly fromAmountUsd: string | null;
  readonly toCoin: string;
  readonly toNetwork: string;
  readonly toAmount: string;
  readonly toAmountUsd: string | null;
  readonly provider: string;
  readonly destAddress: string;
}

// Persisting destAddress at creation time (not on the first sync tick)
// closes the reload race: the proof must be queryable before the engine's
// first verified snapshot lands.
export function buildCreatedSwapHistoryRow(info: CreatedSwapInfo): SwapHistoryRow {
  return {
    flowId: info.flowId,
    serverSwapId: info.flowId,
    createdAt: new Date().toISOString(),
    fromCoin: info.fromCoin,
    fromNetwork: info.fromNetwork,
    fromAmount: info.fromAmount,
    fromAmountUsd: info.fromAmountUsd,
    toCoin: info.toCoin,
    toNetwork: info.toNetwork,
    toAmount: info.toAmount,
    toAmountUsd: info.toAmountUsd,
    provider: info.provider,
    status: "creating",
    expiresAt: null,
    depositAddress: null,
    destAddress: info.destAddress,
    outputTxHash: null,
  };
}

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
