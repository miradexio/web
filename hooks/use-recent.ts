"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { resolveWebConfig } from "@/lib/miradex-web/config";
import type { RecentSwap } from "../components/web-components/types";

const SECONDS_PER_YEAR = 31_536_000;
const SECONDS_PER_MONTH = 2_592_000;
const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_MINUTE = 60;

const recentSwapSchema = z.object({
  fromToken: z.string(),
  toToken: z.string(),
  provider: z.string(),
  status: z.string(),
  amountIn: z.string(),
  amountInUsd: z.string().nullable(),
  expectedAmountOut: z.string().nullable(),
  expectedAmountOutUsd: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  durationSeconds: z.number().int().nullable(),
});

const recentsEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    recents: z.array(recentSwapSchema),
  }),
});

type ApiRecentSwap = z.infer<typeof recentSwapSchema>;

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
  const id = [
    api.provider,
    api.fromToken,
    api.toToken,
    api.amountIn,
    api.expectedAmountOut ?? "0",
    api.createdAt,
  ].join(":");

  return {
    id,
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

function recentsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}/api/v1/swap/recents`;
}

async function fetchRecentsFrom(url: string): Promise<readonly ApiRecentSwap[]> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`recents request failed: ${response.status}`);
  }
  const raw: unknown = await response.json();
  const parsed = recentsEnvelopeSchema.parse(raw);
  return parsed.data.recents;
}

async function fetchRecents(): Promise<readonly ApiRecentSwap[]> {
  const { apiUrl } = resolveWebConfig();
  const primaryUrl = recentsUrl(apiUrl);
  try {
    return await fetchRecentsFrom(primaryUrl);
  } catch (error) {
    if (!apiUrl.startsWith("/api/proxy")) throw error;
    return fetchRecentsFrom("/api/v1/swap/recents");
  }
}

export function useRecent() {
  return useQuery<readonly RecentSwap[]>({
    queryKey: ["recent"],
    queryFn: async () => {
      const recents = await fetchRecents();
      return recents.map(toRecentSwap);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
