import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { formatNumber, formatUsd } from "../../web-components/swap-shared";
import { providerLabel, providerLogo, tokenIconUrl } from "./provider";

type PairSummaryProps = {
  readonly fromToken: string | null;
  readonly toToken: string | null;
  readonly depositAmount: string | null;
  readonly expectedOut: string | null;
  readonly amountInUsd: string | null;
  readonly expectedOutUsd: string | null;
  readonly provider: string | null;
  // Renders dimmed + "Original request" header. Used on refund/failure so
  // the user sees what they asked for without mistaking the receive number
  // for what arrived.
  readonly muted?: boolean;
};

export function PairSummary({
  fromToken,
  toToken,
  depositAmount,
  expectedOut,
  amountInUsd,
  expectedOutUsd,
  provider,
  muted = false,
}: PairSummaryProps) {
  return (
    <div
      className={`rounded-xl border border-bg/15 bg-[#D8C8A2] p-4 ${muted ? "opacity-60" : ""}`}
    >
      {muted && (
        <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
          Original request
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AssetLine
          label="You send"
          icon={tokenIconUrl(fromToken)}
          amount={depositAmount ? formatNumber(depositAmount, 8) : "—"}
          symbol={fromToken ?? "—"}
          usd={amountInUsd}
        />
        <ArrowRight className="hidden h-4 w-4 text-bg/45 sm:inline" aria-hidden="true" />
        <AssetLine
          label="You receive"
          icon={tokenIconUrl(toToken)}
          amount={expectedOut ? formatNumber(expectedOut, 6) : "—"}
          symbol={toToken ?? "—"}
          usd={expectedOutUsd}
          approx
          align="right"
        />
      </div>
      {provider && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-bg/15 pt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-bg/55">
          <span>Routed via</span>
          {providerLogo(provider) ? (
            <Image
              src={providerLogo(provider) ?? ""}
              alt=""
              width={14}
              height={14}
              className="h-[14px] w-[14px] rounded-full bg-bg/[0.05] p-px"
              unoptimized
            />
          ) : (
            <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-bg/15 text-[8px] font-bold text-bg">
              {providerLabel(provider).charAt(0)}
            </span>
          )}
          <span className="font-semibold text-bg">{providerLabel(provider)}</span>
        </div>
      )}
    </div>
  );
}

type AssetLineProps = {
  readonly label: string;
  readonly icon: string | null;
  readonly amount: string;
  readonly symbol: string;
  readonly usd: string | null;
  readonly approx?: boolean;
  readonly align?: "left" | "right";
};

function AssetLine({ label, icon, amount, symbol, usd, approx, align = "left" }: AssetLineProps) {
  const alignClass = align === "right" ? "sm:items-end sm:text-right" : "items-start";
  return (
    <div className={`flex flex-col gap-0.5 ${alignClass}`}>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {align === "right" && (
          <span className="font-mono text-[18px] font-medium tracking-[-0.02em] text-bg">
            {approx && <span className="mr-1 text-bg/50">≈</span>}
            {amount}
            <span className="ml-1.5 text-bg/65">{symbol}</span>
          </span>
        )}
        {icon ? (
          <Image
            src={icon}
            alt=""
            width={22}
            height={22}
            className="h-[22px] w-[22px] rounded-full"
            unoptimized
          />
        ) : (
          <span className="h-[22px] w-[22px] rounded-full bg-bg/10" aria-hidden="true" />
        )}
        {align !== "right" && (
          <span className="font-mono text-[18px] font-medium tracking-[-0.02em] text-bg">
            {approx && <span className="mr-1 text-bg/50">≈</span>}
            {amount}
            <span className="ml-1.5 text-bg/65">{symbol}</span>
          </span>
        )}
      </div>
      {usd && (
        <span className="font-mono text-[10.5px] text-bg/55">≈ {formatUsd(usd)}</span>
      )}
    </div>
  );
}
