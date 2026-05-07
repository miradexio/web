"use client";

import { formatDuration } from "./format";
import type { Tone } from "./types";
import { ReceiptSuccess } from "./receipt-two-up-success";
import { ReceiptExpired } from "./receipt-two-up-expired";
import { ReceiptRefund } from "./receipt-two-up-refund";
import { ReceiptAtomicFailed } from "./receipt-two-up-atomic-failed";

interface ReceiptTwoUpProps {
  readonly tone: Tone;
  readonly phase: string;
  readonly provider: string | null;
  readonly actualOut: string | null;
  readonly toToken: string | null;
  readonly fromToken: string | null;
  readonly outputTxHash: string | null;
  readonly refundTxid: string | null;
  readonly depositAmount: string | null;
  readonly durationSec: number | null;
  readonly destAddress: string | null;
  readonly refundAddress: string | null;
  readonly errorMessage: string | null;
  readonly onCopy: (value: string, key: string) => void;
  readonly copiedKey: string | null;
  // Atomic-only: drives the failed-atomic receipt's "Restart swap" cleanup +
  // redirect. Null for non-atomic or before the snapshot surfaces them;
  // receipt degrades to the generic failed UI when missing.
  readonly keystoreId: string | null;
  readonly serverSwapId: string | null;
  readonly swapNumber: string | null;
}

export function ReceiptTwoUp(props: ReceiptTwoUpProps): React.JSX.Element {
  const duration = formatDuration(props.durationSec);

  // SafelyAborted on atomic flows: wire FAILED -> status=failed -> phase=failed.
  // Non-atomic providers fall through (no "no funds locked" guarantee).
  if (
    props.phase === "failed" &&
    props.provider === "atomicswap" &&
    props.keystoreId !== null
  ) {
    return (
      <ReceiptAtomicFailed
        keystoreId={props.keystoreId}
        serverSwapId={props.serverSwapId}
        swapNumber={props.swapNumber}
        errorMessage={props.errorMessage}
      />
    );
  }

  if (props.phase === "refunded") {
    return (
      <ReceiptRefund
        actualOut={props.actualOut}
        depositAmount={props.depositAmount}
        fromToken={props.fromToken}
        refundAddress={props.refundAddress}
        refundTxid={props.refundTxid}
        duration={duration}
        onCopy={props.onCopy}
        copiedKey={props.copiedKey}
        errorMessage={props.errorMessage}
      />
    );
  }

  if (props.phase === "expired") {
    return <ReceiptExpired errorMessage={props.errorMessage} provider={props.provider} />;
  }

  return (
    <ReceiptSuccess
      tone={props.tone}
      actualOut={props.actualOut}
      toToken={props.toToken}
      outputTxHash={props.outputTxHash}
      destAddress={props.destAddress}
      duration={duration}
      errorMessage={props.errorMessage}
      onCopy={props.onCopy}
      copiedKey={props.copiedKey}
    />
  );
}
