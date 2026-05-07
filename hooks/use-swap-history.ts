"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useEngineActions } from "@/hooks/use-engine-actions";
import {
  deleteSwapHistory,
  isTerminalStatus,
  loadSwapHistory,
  type SwapHistoryRow,
} from "@/lib/storage/swap-history";

export const SWAP_HISTORY_QUERY_KEY = ["swap-history"] as const;

export function useSwapHistory(): UseQueryResult<readonly SwapHistoryRow[]> {
  return useQuery<readonly SwapHistoryRow[]>({
    queryKey: SWAP_HISTORY_QUERY_KEY,
    queryFn: loadSwapHistory,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useDeleteSwap(): (flowId: string) => Promise<void> {
  const queryClient = useQueryClient();
  const actions = useEngineActions();

  return useCallback(
    async (flowId: string) => {
      const cached = queryClient.getQueryData<readonly SwapHistoryRow[]>(
        SWAP_HISTORY_QUERY_KEY,
      );
      const row = cached?.find((r) => r.flowId === flowId);
      if (row && !isTerminalStatus(row.status)) {
        try {
          actions.cancel(flowId);
        } catch {
          // engine may have already torn down — ignore
        }
      }
      try {
        actions.destroy(flowId);
      } catch {
        // not loaded — ignore
      }
      await deleteSwapHistory(flowId);
      await queryClient.invalidateQueries({ queryKey: SWAP_HISTORY_QUERY_KEY });
    },
    [queryClient, actions],
  );
}
