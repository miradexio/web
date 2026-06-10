"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEngineActions } from "@/hooks/use-engine-actions";
import { SWAP_HISTORY_QUERY_KEY } from "@/hooks/use-swap-history";
import { getRegistry } from "@/lib/miradex-web/registry";
import { patchKeystoreSwapId } from "@/lib/miradex-web/idb";
import {
  buildAtomicHistoryRow,
  extractSnapshot,
  isTerminalStatus,
  loadSwapHistory,
  saveSwapHistory,
  snapshotsEqual,
  updateSwapHistory,
} from "@/lib/storage/swap-history";

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
