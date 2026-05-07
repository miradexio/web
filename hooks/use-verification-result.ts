"use client";

import type { SwapDetail, VerificationResult } from "@miradexio/client";
import { useTrade } from "./use-trade";
import { useProtocolVerification } from "./use-protocol-verification";

export interface VerifyView {
  readonly serverData: SwapDetail | null;
  readonly verification: VerificationResult | null;
  readonly isLoadingServer: boolean;
  readonly isLoadingProtocol: boolean;
  readonly serverError: Error | null;
  readonly protocolError: Error | null;
}

export function useVerificationResult(swapId: string): VerifyView {
  const trade = useTrade(swapId);
  const proto = useProtocolVerification(trade.data ?? null);

  return {
    serverData: trade.data ?? null,
    verification: proto.data ?? null,
    isLoadingServer: trade.isLoading,
    isLoadingProtocol: proto.isLoading,
    serverError: trade.error instanceof Error ? trade.error : null,
    protocolError: proto.error instanceof Error ? proto.error : null,
  };
}
