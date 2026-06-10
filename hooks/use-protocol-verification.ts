"use client";

import { useQuery } from "@tanstack/react-query";
import type { SwapDetail, VerificationResult } from "@miradexio/client";
import { verifyDepositAddress } from "@miradexio/client";

export function useProtocolVerification(swapDetail: SwapDetail | null | undefined) {
  const verification = swapDetail?.verification;
  const depositAddress = swapDetail?.depositAddress;
  // destAddress is null on restricted (ownership-proof-less) details; there
  // is nothing to verify without it.
  const destAddress = swapDetail?.destAddress;
  const ready = swapDetail != null && verification != null && depositAddress != null && destAddress != null;

  return useQuery<VerificationResult | null>({
    queryKey: ["protocol-verify", swapDetail?.swapNumber],
    queryFn: async () => {
      if (!ready) return null;
      return verifyDepositAddress({
        depositAddress,
        verification,
        destAddress,
        refundAddress: swapDetail.refundAddress ?? "",
        toToken: swapDetail.toToken,
        amount: swapDetail.amountIn,
        expectedAmountOut: swapDetail.expectedAmountOut ?? undefined,
        expectedDestAddress: destAddress,
      });
    },
    enabled: ready,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    staleTime: 60_000,
  });
}
