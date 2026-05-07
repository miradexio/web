import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatNumber, formatUsd } from "../../web-components/swap-shared";
import { formatTimeLeft } from "./format";
import { buildPaymentUri } from "./payment-uri";

type DepositTwoUpProps = {
  readonly depositAddress: string;
  readonly depositAmount: string | null;
  readonly fromToken: string | null;
  readonly amountInUsd: string | null;
  readonly timeLeftMs: number | null;
  readonly onCopy: (value: string, key: string) => void;
  readonly copiedKey: string | null;
};

export function DepositTwoUp({
  depositAddress,
  depositAmount,
  fromToken,
  amountInUsd,
  timeLeftMs,
  onCopy,
  copiedKey,
}: DepositTwoUpProps) {
  const expired = timeLeftMs !== null && timeLeftMs <= 0;
  const copied = copiedKey === "deposit-addr";
  const paymentUri = buildPaymentUri(fromToken, depositAddress, depositAmount);
  const [withAmount, setWithAmount] = useState<boolean>(false);
  const qrValue = withAmount ? paymentUri : depositAddress;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-3.5">
          <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
            Deposit address
          </div>
          <div className="flex items-start gap-2.5">
            <code className="break-all font-mono text-[12.5px] font-medium leading-[1.45] text-bg">
              {depositAddress}
            </code>
            <button
              type="button"
              onClick={() => onCopy(depositAddress, "deposit-addr")}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-bg/20 bg-bg/[0.05] text-bg transition-colors hover:bg-bg/[0.10]"
              aria-label="Copy deposit address"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#1F6B3A]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => depositAmount && onCopy(depositAmount, "deposit-amount")}
          disabled={!depositAmount}
          className="group flex flex-col items-stretch rounded-xl border border-bg/15 bg-[#D8C8A2] p-3.5 text-left transition-colors hover:bg-[#E0CFA8] disabled:cursor-default disabled:hover:bg-[#D8C8A2]"
          title={depositAmount ? "Click to copy" : undefined}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
              Amount
            </span>
            {depositAmount &&
              (copiedKey === "deposit-amount" ? (
                <Check className="h-3 w-3 text-[#1F6B3A]" />
              ) : (
                <Copy className="h-3 w-3 text-bg/45 transition-opacity group-hover:text-bg/65" />
              ))}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[20px] font-medium tracking-[-0.025em] text-bg">
              {depositAmount ? formatNumber(depositAmount, 8) : "—"}
            </span>
            <span className="font-mono text-[12px] font-semibold text-bg/70">
              {fromToken ?? ""}
            </span>
          </div>
          {amountInUsd && (
            <div className="mt-0.5 font-mono text-[10.5px] text-bg/55">
              ≈ {formatUsd(amountInUsd)}
            </div>
          )}
        </button>
      </div>
      <div className="flex flex-col items-center gap-2 sm:items-center">
        <div className="rounded-xl border border-bg/15 bg-[#F5EFE0] p-2.5">
          <QRCodeSVG
            value={qrValue}
            size={128}
            level="M"
            fgColor="#1A1F35"
            bgColor="transparent"
          />
        </div>
        <div className="inline-flex rounded-full border border-bg/20 bg-bg/[0.04] p-0.5">
          <button
            type="button"
            onClick={() => setWithAmount(false)}
            className={
              !withAmount
                ? "rounded-full bg-bg px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-surface"
                : "rounded-full px-2.5 py-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-bg/65 transition-colors hover:text-bg"
            }
            aria-pressed={!withAmount}
          >
            Address
          </button>
          <button
            type="button"
            onClick={() => setWithAmount(true)}
            className={
              withAmount
                ? "rounded-full bg-bg px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-surface"
                : "rounded-full px-2.5 py-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-bg/65 transition-colors hover:text-bg"
            }
            aria-pressed={withAmount}
          >
            + amount
          </button>
        </div>
        {timeLeftMs !== null && (
          <span
            className="font-mono text-[12px] font-semibold tracking-[0.14em] text-[#B41E28]"
            aria-label={expired ? "Expired" : "Time remaining"}
          >
            {expired ? "Expired" : formatTimeLeft(timeLeftMs)}
          </span>
        )}
      </div>
    </div>
  );
}
