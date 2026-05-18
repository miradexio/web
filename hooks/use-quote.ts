"use client";

import { useQuery } from "@tanstack/react-query";
import type { Quote } from "../components/web-components/types";
import { useApiClient } from "@/hooks/use-api-client";

interface UseQuoteParams {
  fromCoin: string;
  fromNetwork: string;
  toCoin: string;
  toNetwork: string;
  amount: number;
  enabled: boolean;
}

const ALLOWED_QUOTE_SOURCES: ReadonlySet<Quote["source"]> = new Set([
  "live",
  "cache",
] as const);

function normaliseSource(raw: string | undefined): Quote["source"] {
  return raw !== undefined && ALLOWED_QUOTE_SOURCES.has(raw as Quote["source"])
    ? (raw as Quote["source"])
    : "live";
}

export function useQuote({
  fromCoin,
  fromNetwork,
  toCoin,
  toNetwork,
  amount,
  enabled,
}: UseQuoteParams) {
  const apiClient = useApiClient();

  const query = useQuery<Quote[]>({
    queryKey: ["quotes", fromCoin, fromNetwork, toCoin, toNetwork, amount],
    queryFn: async () => {
      if (fromCoin.length === 0 || toCoin.length === 0 || amount <= 0) return [];

      const response = await apiClient.getQuotes({
        from: fromCoin.toLowerCase(),
        to: toCoin.toLowerCase(),
        amount: amount.toString(),
        fromChain: fromNetwork.toLowerCase(),
        toChain: toNetwork.toLowerCase(),
      });

      return response.quotes.map((q): Quote => {
        const durationSecs = q.estimatedDurationSeconds;
        return {
          provider: q.provider,
          variantId: q.variantId,
          variantLabel: q.variantLabel,
          fromCoin,
          fromNetwork: q.fromChain,
          toCoin,
          toNetwork: q.toChain,
          fromAmount: amount.toString(),
          toAmount: q.expectedOutput,
          fromAmountUsd: response.amountInUsd ?? undefined,
          toAmountUsd: q.expectedOutputUsd ?? undefined,
          rate: parseFloat(q.expectedOutput) / amount,
          fees: q.fees.map((f) => ({ ...f, amountUsd: undefined })),
          estimatedTime:
            durationSecs !== null ? `${String(Math.ceil(durationSecs / 60))}m` : "10-20m",
          estimatedDurationSeconds: durationSecs ?? undefined,
          minAmount: q.minAmount ?? undefined,
          maxAmount: q.maxAmount ?? undefined,
          priceImpactPct: q.priceImpactPct ?? undefined,
          recommendedSlippageBps: q.recommendedSlippageBps ?? undefined,
          source: normaliseSource(response.source),
          precision: q.precision,
        };
      });
    },
    enabled: enabled && amount > 0,
    refetchInterval: 30_000,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    lastUpdated: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}
