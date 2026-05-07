"use client";

import { Check, Copy } from "lucide-react";
import { formatNumber } from "../../web-components/swap-shared";
import { truncateMiddle } from "./format";
import type { Tone } from "./types";

export interface ReceiptSuccessProps {
  readonly tone: Tone;
  readonly actualOut: string | null;
  readonly toToken: string | null;
  readonly outputTxHash: string | null;
  readonly destAddress: string | null;
  readonly duration: string | null;
  readonly errorMessage: string | null;
  readonly onCopy: (value: string, key: string) => void;
  readonly copiedKey: string | null;
}

// Default receipt: non-atomic, non-refund, non-expired flows.
export function ReceiptSuccess({
  tone,
  actualOut,
  toToken,
  outputTxHash,
  destAddress,
  duration,
  errorMessage,
  onCopy,
  copiedKey,
}: ReceiptSuccessProps): React.JSX.Element {
  const txCopied = copiedKey === "output-tx";
  const destCopied = copiedKey === "dest-address";

  return (
    <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
        {tone === "success" ? "You received" : "Result"}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[24px] font-medium tracking-[-0.025em] text-bg">
          {actualOut ? formatNumber(actualOut, 8) : "—"}
        </span>
        <span className="font-mono text-[12px] font-semibold text-bg/75">
          {tone === "success" ? toToken ?? "" : ""}
        </span>
      </div>
      {destAddress && tone === "success" && (
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[10.5px] text-bg/55">
          <span>→ {truncateMiddle(destAddress, 6, 6)}</span>
          <button
            type="button"
            onClick={() => onCopy(destAddress, "dest-address")}
            className="flex h-5 w-5 items-center justify-center rounded-md border border-bg/20 bg-bg/[0.05] text-bg/75 transition-colors hover:bg-bg/[0.10]"
            aria-label="Copy destination address"
          >
            {destCopied ? (
              <Check className="h-2.5 w-2.5 text-[#1F6B3A]" />
            ) : (
              <Copy className="h-2.5 w-2.5" />
            )}
          </button>
        </div>
      )}
      {(duration || outputTxHash) && (
        <div className="mt-3 flex flex-col gap-2 border-t border-bg/15 pt-2.5">
          {duration && (
            <div className="flex items-baseline justify-between font-mono text-[11px] text-bg/65">
              <span className="uppercase tracking-[0.14em]">Completed in</span>
              <span className="text-bg">{duration}</span>
            </div>
          )}
          {outputTxHash && (
            <div className="flex items-center gap-2 font-mono text-[11px] text-bg/65">
              <span className="uppercase tracking-[0.14em]">Tx</span>
              <code className="flex-1 truncate text-bg">{truncateMiddle(outputTxHash, 8, 6)}</code>
              <button
                type="button"
                onClick={() => onCopy(outputTxHash, "output-tx")}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-bg/20 bg-bg/[0.05] text-bg transition-colors hover:bg-bg/[0.10]"
                aria-label="Copy transaction hash"
              >
                {txCopied ? (
                  <Check className="h-3 w-3 text-[#1F6B3A]" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
      {errorMessage && (
        <p className="mt-2 font-mono text-[11px] leading-[1.4] text-[#B41E28]">{errorMessage}</p>
      )}
    </div>
  );
}
