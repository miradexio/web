import type { RequiredAction, VerificationResult } from "@miradexio/client";

export type Tone = "progress" | "success" | "fail" | "warn";

export type FlowKind = "swap" | "atomic";

export interface FlowView {
  readonly kind: FlowKind;
  readonly phase: string;
  /** True when the server withheld sensitive fields (no ownership proof). */
  readonly restricted: boolean;
  readonly fromToken: string | null;
  readonly toToken: string | null;
  readonly depositAddress: string | null;
  readonly depositAmount: string | null;
  readonly expectedOut: string | null;
  readonly destAddress: string | null;
  readonly refundAddress: string | null;
  readonly amountInUsd: string | null;
  readonly expectedOutUsd: string | null;
  readonly provider: string | null;
  readonly verification: VerificationResult | null;
  readonly verificationSourceUrl: string | null;
  readonly expiresAt: string | null;
  readonly requiredAction: RequiredAction | null;
  readonly errorMessage: string | null;
  readonly statusMessage: string | null;
  readonly outputTxHash: string | null;
  readonly refundTxid: string | null;
  readonly actualOut: string | null;
  readonly durationSec: number | null;
  readonly swapNumber: string | null;
  readonly keystoreId: string | null;
  readonly serverSwapId: string | null;
}
