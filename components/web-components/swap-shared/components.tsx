"use client";

import Image from "next/image";
import { ChevIcon, FlipIcon } from "../icons";
import type { Token } from "../types";

const PLACEHOLDER = "—";
const ZERO_AMOUNT = "0.0000";
const LOADING_AMOUNT = "...";

export function findToken(
  tokens: readonly Token[],
  coin: string | null,
  chain?: string | null,
): Token | undefined {
  if (!coin) return undefined;
  return tokens.find(
    (t) =>
      t.coin.toUpperCase() === coin.toUpperCase() &&
      (!chain || t.network.toLowerCase() === chain.toLowerCase()),
  );
}

export function formatNumber(value: string | number | undefined, decimals = 4): string {
  if (value === undefined || value === null) return PLACEHOLDER;
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return PLACEHOLDER;
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function formatUsd(value: string | undefined): string {
  if (!value) return PLACEHOLDER;
  const n = parseFloat(value);
  if (Number.isNaN(n) || n === 0) return PLACEHOLDER;
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type TokenPillProps = {
  readonly token: Token | null;
  readonly onClick: () => void;
};

export function TokenPill({ token, onClick }: TokenPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-2 rounded-full border border-bg/20 bg-[#E5D5BE] py-[6px] pl-[6px] pr-3 transition-colors hover:bg-[#F0E0C8]"
    >
      {token ? (
        <>
          <Image
            src={token.icon}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 rounded-full"
            unoptimized
          />
          <div className="flex flex-col items-start">
            <span className="text-[13.5px] font-semibold text-bg">{token.coin}</span>
            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-bg/70">
              {token.network}
            </span>
          </div>
        </>
      ) : (
        <span className="px-1 text-[13px] font-semibold text-bg">Select</span>
      )}
      <ChevIcon />
    </button>
  );
}

type FlipButtonProps = {
  readonly onClick: () => void;
};

export function FlipButton({ onClick }: FlipButtonProps) {
  return (
    <div className="relative z-10 -my-[10px] flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="ease-elastic inline-flex h-8 w-8 items-center justify-center rounded-lg border border-bg/20 bg-[#E5D5BE] text-bg transition-transform duration-[350ms] hover:rotate-180"
        aria-label="Flip from and to tokens"
      >
        <FlipIcon />
      </button>
    </div>
  );
}

type SwapRowProps = {
  readonly label: string;
  readonly token: Token | null;
  readonly amount: string;
  readonly onAmountChange?: (value: string) => void;
  readonly usd?: string;
  readonly readOnly?: boolean;
  readonly loading?: boolean;
  readonly onPickToken: () => void;
};

function readOnlyDisplay(amount: string, loading: boolean | undefined): string {
  if (loading) return LOADING_AMOUNT;
  if (!amount) return ZERO_AMOUNT;
  // Quote estimate display only — never wire this through to a real
  // on-chain amount. Providers like THORChain require the FULL precision
  // (8 dp for BTC, 18 dp for EVM) at deposit/swap time; the swap-client
  // pages keep their own un-rounded paths for that.
  return formatNumber(amount, 4);
}

export function SwapRow({
  label,
  token,
  amount,
  onAmountChange,
  usd,
  readOnly,
  loading,
  onPickToken,
}: SwapRowProps) {
  const displayAmount = readOnly ? readOnlyDisplay(amount, loading) : amount;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-[6px] font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg">
          {label}
        </div>
        {readOnly ? (
          <div className="text-[28px] font-medium tracking-[-0.025em] text-bg">
            {displayAmount}
          </div>
        ) : (
          <input
            value={displayAmount}
            onChange={(e) => onAmountChange?.(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder={ZERO_AMOUNT}
            inputMode="decimal"
            aria-label={`${label} amount`}
            className="w-full bg-transparent text-[28px] font-medium tracking-[-0.025em] text-bg outline-none placeholder:text-bg/40"
          />
        )}
        <div className="mt-[2px] font-mono text-[11px] font-medium text-bg/70">
          {usd ? `≈ ${formatUsd(usd)}` : PLACEHOLDER}
        </div>
      </div>

      <TokenPill token={token} onClick={onPickToken} />
    </div>
  );
}
