"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EngineState } from "@miradexio/client";
import { useEngineActions } from "@/hooks/use-engine-actions";
import { SWAP_HISTORY_QUERY_KEY } from "@/hooks/use-swap-history";
import { getRegistry } from "@/lib/miradex-web/registry";
import { patchKeystoreSwapId } from "@/lib/miradex-web/idb";
import {
  isTerminalStatus,
  loadSwapHistory,
  saveSwapHistory,
  updateSwapHistory,
  type SwapHistoryRow,
} from "@/lib/storage/swap-history";

interface SyncSnapshot {
  readonly status: string;
  readonly expiresAt: string | null;
  readonly depositAddress: string | null;
  readonly outputTxHash: string | null;
  readonly serverSwapId: string | null;
}

function extractSnapshot(state: EngineState): SyncSnapshot {
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
    outputTxHash,
    serverSwapId,
  };
}

function snapshotsEqual(prev: SwapHistoryRow, next: SyncSnapshot): boolean {
  return (
    prev.status === next.status &&
    prev.expiresAt === next.expiresAt &&
    prev.depositAddress === next.depositAddress &&
    prev.outputTxHash === next.outputTxHash &&
    // serverSwapId is monotonic: once set, it never reverts to null.
    (next.serverSwapId === null || prev.serverSwapId === next.serverSwapId)
  );
}

// Build the initial atomic-flow row when its serverSwapId arrives. Atomic
// flows are always BTC->XMR via atomicswap, so coin/network/provider are fixed.
function buildAtomicHistoryRow(
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
    outputTxHash: next.outputTxHash,
  };
}

export function useHistorySync(): null {
  const queryClient = useQueryClient();
  const actions = useEngineActions();

  useEffect(() => {
    let cancelled = false;
    const registry = getRegistry();

    void (async () => {
      const rows = await loadSwapHistory();
      if (cancelled) return;
      for (const row of rows) {
        if (isTerminalStatus(row.status)) continue;
        try {
          await actions.resume(row.flowId);
        } catch {
          // engine resume failures are non-fatal — the row stays in its last status
        }
      }
    })();

    const onChange = (): void => {
      void (async () => {
        const stored = await loadSwapHistory();
        const byFlowId = new Map(stored.map((r) => [r.flowId, r] as const));
        let mutated = false;

        // Drive from registry, not stored rows: atomic-flow rows are
        // created here on first serverSwapId. Pre-server-id atomic flows
        // live only in the keystores store + sheet.
        for (const flowId of registry.listFlowIds()) {
          const state = registry.getStateOf(flowId);
          if (state === null) continue;
          const next = extractSnapshot(state);
          const existing = byFlowId.get(flowId);

          if (existing) {
            if (snapshotsEqual(existing, next)) continue;
            await updateSwapHistory(flowId, next);
            mutated = true;
          } else if (next.serverSwapId !== null && next.serverSwapId.length > 0) {
            // First-seen serverSwapId for this flow. Atomic only;
            // non-atomic rows are created up-front in useSwap.onSuccess.
            const row = buildAtomicHistoryRow(flowId, state, next);
            if (row !== null) {
              await saveSwapHistory(row);
              mutated = true;
            }
          }
          // else: pre-server-id atomic flow — nothing in history yet.

          // Mirror serverSwapId onto the keystore row so cold resumes
          // (resumeFresh) route through Path A instead of re-quoting.
          if (
            next.serverSwapId !== null &&
            next.serverSwapId.length > 0 &&
            state.activeFlow === "atomic"
          ) {
            await patchKeystoreSwapId(flowId, next.serverSwapId).catch(() => undefined);
          }
        }

        if (mutated && !cancelled) {
          await queryClient.invalidateQueries({ queryKey: SWAP_HISTORY_QUERY_KEY });
        }
      })();
    };

    const unsubscribe = registry.subscribe(onChange);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [actions, queryClient]);

  return null;
}
