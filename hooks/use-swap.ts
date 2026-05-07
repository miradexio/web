"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { SwapFee, SwapProvider, SwapQuote } from "@miradexio/client";
import { useEngineActions } from "@/hooks/use-engine-actions";
import { SWAP_HISTORY_QUERY_KEY } from "@/hooks/use-swap-history";
import { saveSwapHistory } from "@/lib/storage/swap-history";
import type { Quote, QuoteFee, SwapRequest } from "../components/web-components/types";

interface SwapMutationInput extends SwapRequest {
  readonly selectedQuote: Quote;
  // BTC<->XMR only. Bind the new swap to an existing keystore (skip keygen
  // + saveKeystore in the SDK). Set by the quote form on
  // `?reuseKeystore=<UUID>` — the restart-after-failure flow uses it so a
  // re-quote inherits the original funding address + any UTXOs at it.
  readonly existingKeystoreId?: string;
}

interface SwapMutationResult {
  readonly flowId: string;
  readonly request: SwapMutationInput;
}

const KNOWN_PROVIDERS: ReadonlySet<string> = new Set([
  "chainflip",
  "thorchain",
  "near_intents",
  "atomicswap",
]);

const INITIAL_STATUS = "creating";

function isAtomicPair(fromCoin: string, toCoin: string): boolean {
  return fromCoin.toUpperCase() === "BTC" && toCoin.toUpperCase() === "XMR";
}

function toSwapProvider(name: string): SwapProvider {
  return (KNOWN_PROVIDERS.has(name) ? name : `unknown:${name}`) as SwapProvider;
}

function uiFeeToSwapFee(f: QuoteFee): SwapFee {
  return { type: f.type, amount: f.amount, token: f.token };
}

function uiQuoteToSwapQuote(q: Quote): SwapQuote {
  const precision: SwapQuote["precision"] = q.precision === "exact" ? "exact" : "indicative";
  return {
    provider: toSwapProvider(q.provider),
    variantId: q.variantId,
    variantLabel: q.variantLabel,
    expectedOutput: q.toAmount,
    fromChain: q.fromNetwork,
    toChain: q.toNetwork,
    estimatedDurationSeconds: q.estimatedDurationSeconds ?? null,
    fees: q.fees.map(uiFeeToSwapFee),
    recommendedSlippageBps: q.recommendedSlippageBps ?? null,
    minAmount: q.minAmount ?? null,
    maxAmount: q.maxAmount ?? null,
    expectedOutputUsd: q.toAmountUsd ?? null,
    priceImpactPct: q.priceImpactPct ?? null,
    precision,
  };
}

export function useSwap() {
  const router = useRouter();
  const actions = useEngineActions();
  const queryClient = useQueryClient();

  return useMutation<SwapMutationResult, Error, SwapMutationInput>({
    mutationFn: async (req) => {
      const amount = String(req.amount);
      const destAddress = req.toAddress;
      const refundAddress = req.fromAddress ?? "";
      const result = isAtomicPair(req.fromCoin, req.toCoin)
        ? await actions.startAtomicSwap({
            amount,
            destAddress,
            refundAddress,
            existingKeystoreId: req.existingKeystoreId,
          })
        : await actions.startSwap({
            fromToken: req.fromCoin,
            fromChain: req.fromNetwork,
            toToken: req.toCoin,
            toChain: req.toNetwork,
            amount,
            destAddress,
            refundAddress,
            selectedQuote: uiQuoteToSwapQuote(req.selectedQuote),
            // UI slippage is in percent (e.g. 1.5 = 1.5%); engine wants bps.
            slippageBps:
              req.slippage !== undefined ? Math.round(req.slippage * 100) : undefined,
          });
      return { flowId: result.flowId, request: req };
    },
    onSuccess: async ({ flowId, request }) => {
      if (flowId.length === 0) return;
      const quote = request.selectedQuote;
      const isAtomic = isAtomicPair(request.fromCoin, request.toCoin);
      // Non-atomic only: flowId === serverSwapId here. Atomic flows have
      // no server number until the user funds the BTC deposit; the row is
      // created by useHistorySync at that point. Until then the swap lives
      // in the keystores store / sheet, not /history.
      if (!isAtomic) {
        await saveSwapHistory({
          flowId,
          serverSwapId: flowId,
          createdAt: new Date().toISOString(),
          fromCoin: request.fromCoin,
          fromNetwork: request.fromNetwork,
          fromAmount: String(request.amount),
          fromAmountUsd: quote.fromAmountUsd ?? null,
          toCoin: request.toCoin,
          toNetwork: request.toNetwork,
          toAmount: quote.toAmount,
          toAmountUsd: quote.toAmountUsd ?? null,
          provider: quote.provider,
          status: INITIAL_STATUS,
          expiresAt: null,
          depositAddress: null,
          outputTxHash: null,
        });
        await queryClient.invalidateQueries({ queryKey: SWAP_HISTORY_QUERY_KEY });
      }
      // ?keystore=<UUID> until the server issues a swap number; SwapClient
      // upgrades to ?id=<MIRA-XXX> when it arrives. Non-atomic = direct id.
      const param = isAtomic ? "keystore" : "id";
      router.push(`/?${param}=${flowId}`);
    },
  });
}
