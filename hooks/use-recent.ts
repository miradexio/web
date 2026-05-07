"use client";

import { useQuery } from "@tanstack/react-query";
import type { RecentSwap as ApiRecentSwap } from "@miradexio/client";
import { useApiClient } from "@/hooks/use-api-client";
import type { RecentSwap } from "../components/web-components/types";

const SECONDS_PER_YEAR = 31_536_000;
const SECONDS_PER_MONTH = 2_592_000;
const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_MINUTE = 60;

function timeAgo(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const diff = Math.floor((Date.now() - created) / 1000);
  if (diff >= SECONDS_PER_YEAR) return `${Math.floor(diff / SECONDS_PER_YEAR)}y ago`;
  if (diff >= SECONDS_PER_MONTH) return `${Math.floor(diff / SECONDS_PER_MONTH)}mo ago`;
  if (diff >= SECONDS_PER_DAY) return `${Math.floor(diff / SECONDS_PER_DAY)}d ago`;
  if (diff >= SECONDS_PER_HOUR) return `${Math.floor(diff / SECONDS_PER_HOUR)}h ago`;
  if (diff >= SECONDS_PER_MINUTE) return `${Math.floor(diff / SECONDS_PER_MINUTE)}m ago`;
  return "Just now";
}

function toRecentSwap(api: ApiRecentSwap): RecentSwap {
  return {
    id: api.swapNumber,
    swapNumber: api.swapNumber,
    fromCoin: api.fromToken,
    fromNetwork: "Native",
    toCoin: api.toToken,
    toNetwork: "Native",
    fromAmount: api.amountIn,
    toAmount: api.expectedAmountOut ?? "0",
    amountInUsd: api.amountInUsd ?? undefined,
    expectedAmountOutUsd: api.expectedAmountOutUsd ?? undefined,
    provider: api.provider,
    status: api.status,
    createdAt: api.createdAt,
    timeAgo: timeAgo(api.createdAt),
    durationSeconds: api.durationSeconds ?? undefined,
  };
}

export function useRecent() {
  const apiClient = useApiClient();
  return useQuery<readonly RecentSwap[]>({
    queryKey: ["recent"],
    queryFn: async () => {
      const recents = await apiClient.getRecents();
      return recents.map(toRecentSwap);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
