"use client";

import { useQuery } from "@tanstack/react-query";
import type { SwapDetail } from "@miradexio/client";
import { useApiClient } from "@/hooks/use-api-client";

const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
  "EXPIRED",
]);

export function useTrade(id: string) {
  const apiClient = useApiClient();
  return useQuery<SwapDetail>({
    queryKey: ["trade", id],
    queryFn: () => apiClient.getSwapDetail(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.toUpperCase();
      return status !== undefined && TERMINAL_STATUSES.has(status) ? false : 10_000;
    },
    enabled: id.length > 0,
  });
}
