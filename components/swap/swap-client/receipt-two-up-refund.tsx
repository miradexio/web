"use client";

import { Check, Copy } from "lucide-react";
import { formatNumber } from "../../web-components/swap-shared";
import { truncateMiddle } from "./format";

// 8-decimal output, sat-level BigInt math to dodge parseFloat drift.
// Null if either input is missing or unparseable.
function subtractBtc(a: string | null, b: string | null): string | null {
  if (!a || !b) return null;
  const aSats = humanToSats(a);
  const bSats = humanToSats(b);
  if (aSats === null || bSats === null) return null;
  const diff = aSats - bSats;
  if (diff <= 0n) return null;
  const whole = diff / 100_000_000n;
  const frac = diff % 100_000_000n;
  return `${whole.toString()}.${frac.toString().padStart(8, "0")}`;
}

function humanToSats(value: string): bigint | null {
  if (!/^\d+(\.\d{0,8})?$/.test(value)) return null;
  const [whole, frac = ""] = value.split(".");
  const padded = frac.padEnd(8, "0").slice(0, 8);
  return BigInt(whole) * 100_000_000n + BigInt(padded);
}

export interface ReceiptRefundProps {
  readonly actualOut: string | null;
  readonly depositAmount: string | null;
  readonly fromToken: string | null;
  readonly refundAddress: string | null;
  readonly refundTxid: string | null;
  readonly duration: string | null;
  readonly onCopy: (value: string, key: string) => void;
  readonly copiedKey: string | null;
  readonly errorMessage: string | null;
}

export function ReceiptRefund({
  actualOut,
  depositAmount,
  fromToken,
  refundAddress,
  refundTxid,
  duration,
  onCopy,
  copiedKey,
  errorMessage,
}: ReceiptRefundProps): React.JSX.Element {
  const refundCopied = copiedKey === "refund-address";
  const txCopied = copiedKey === "refund-tx";
  // Refund is in BTC (source asset). When the SDK has no exact post-fee
  // amount, depositAmount is the next-best signal (off by lock + cancel +
  // refund fees).
  const refundDisplay = actualOut ?? depositAmount;
  const networkFee = subtractBtc(depositAmount, actualOut);

  return (
    <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
        Refund
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[24px] font-medium tracking-[-0.025em] text-bg">
          {refundDisplay ? formatNumber(refundDisplay, 8) : "—"}
        </span>
        <span className="font-mono text-[12px] font-semibold text-bg/75">{fromToken ?? ""}</span>
      </div>
      {refundAddress && (
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[10.5px] text-bg/55">
          <span>Returned to {truncateMiddle(refundAddress, 6, 6)}</span>
          <button
            type="button"
            onClick={() => onCopy(refundAddress, "refund-address")}
            className="flex h-5 w-5 items-center justify-center rounded-md border border-bg/20 bg-bg/[0.05] text-bg/75 transition-colors hover:bg-bg/[0.10]"
            aria-label="Copy refund address"
          >
            {refundCopied ? (
              <Check className="h-2.5 w-2.5 text-[#1F6B3A]" />
            ) : (
              <Copy className="h-2.5 w-2.5" />
            )}
          </button>
        </div>
      )}
      {(duration || networkFee || refundTxid) && (
        <div className="mt-3 flex flex-col gap-2 border-t border-bg/15 pt-2.5">
          {networkFee && (
            <div className="flex items-baseline justify-between font-mono text-[11px] text-bg/65">
              <span className="uppercase tracking-[0.14em]">Network fee</span>
              <span className="text-bg">
                {networkFee} {fromToken ?? ""}
              </span>
            </div>
          )}
          {duration && (
            <div className="flex items-baseline justify-between font-mono text-[11px] text-bg/65">
              <span className="uppercase tracking-[0.14em]">Refunded in</span>
              <span className="text-bg">{duration}</span>
            </div>
          )}
          {refundTxid && (
            <div className="flex items-center gap-2 font-mono text-[11px] text-bg/65">
              <span className="uppercase tracking-[0.14em]">Refund tx</span>
              <code className="flex-1 truncate text-bg">{truncateMiddle(refundTxid, 8, 6)}</code>
              <button
                type="button"
                onClick={() => onCopy(refundTxid, "refund-tx")}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-bg/20 bg-bg/[0.05] text-bg transition-colors hover:bg-bg/[0.10]"
                aria-label="Copy refund transaction hash"
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
