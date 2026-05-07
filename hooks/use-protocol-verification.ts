"use client";

import { useQuery } from "@tanstack/react-query";
import type { SwapDetail, VerificationResult } from "@miradexio/client";
import { verifyDepositAddress } from "@miradexio/client";

export function useProtocolVerification(swapDetail: SwapDetail | null | undefined) {
  const verification = swapDetail?.verification;
  const depositAddress = swapDetail?.depositAddress;
  const ready = swapDetail != null && verification != null && depositAddress != null;

  return useQuery<VerificationResult | null>({
    queryKey: ["protocol-verify", swapDetail?.swapNumber],
    queryFn: async () => {
      if (!ready) return null;
      return verifyDepositAddress({
        depositAddress,
        verification,
        destAddress: swapDetail.destAddress,
        refundAddress: swapDetail.refundAddress ?? "",
        toToken: swapDetail.toToken,
        amount: swapDetail.amountIn,
        expectedAmountOut: swapDetail.expectedAmountOut ?? undefined,
        expectedDestAddress: swapDetail.destAddress,
      });
    },
    enabled: ready,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    staleTime: 60_000,
  });
}
