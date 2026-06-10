"use client";

import { AlertCircle, ArrowRight, Radio } from "lucide-react";
import Image from "next/image";

import { useRecent } from "@/hooks/use-recent";
import { useTokens } from "@/hooks/use-tokens";

import type { RecentSwap, Token } from "../../web-components/types";
import { ProviderIcon } from "./provider-icon";

const MAX_VISIBLE_RECENTS = 8;
const COMPACT_AMOUNT_THRESHOLD = 1_000_000;
const WHOLE_NUMBER_THRESHOLD = 10_000;
const SIGNIFICANT_DIGITS = 4;

function formatAmount(amount: string): string {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return "—";
  const magnitude = Math.abs(parsed);
  if (magnitude === 0) return "0";
  if (magnitude >= COMPACT_AMOUNT_THRESHOLD) {
    return parsed.toLocaleString(undefined, {
      maximumSignificantDigits: 3,
      notation: "compact",
    });
  }
  if (magnitude >= WHOLE_NUMBER_THRESHOLD) {
    return parsed.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return parsed.toLocaleString(undefined, {
    maximumSignificantDigits: SIGNIFICANT_DIGITS,
  });
}

function statusDotClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "complete") return "bg-green";
  if (normalized === "failed") return "bg-[#FF6B6B]";
  return "bg-accent";
}

function statusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "complete") return "Completed";
  if (normalized === "pending" || normalized === "awaiting") return "Pending";
  if (normalized === "failed") return "Failed";
  return status.replaceAll("_", " ");
}

function shortTimeAgo(timeAgo: string): string {
  return timeAgo.replace(/\s+ago$/u, "");
}

function findTokenIcon(tokens: readonly Token[], symbol: string): string | null {
  const token = tokens.find((candidate) => candidate.coin.toUpperCase() === symbol.toUpperCase());
  return token?.icon ?? null;
}

function TokenIcon({
  symbol,
  icon,
}: {
  readonly symbol: string;
  readonly icon: string | null;
}): React.JSX.Element {
  if (icon) {
    return (
      <Image
        src={icon}
        alt={symbol}
        title={symbol}
        width={17}
        height={17}
        className="h-[17px] w-[17px] shrink-0 rounded-full object-contain"
        unoptimized
      />
    );
  }

  return (
    <span
      title={symbol}
      className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-ink/10 font-mono text-[6px] font-bold text-ink"
    >
      {symbol.slice(0, 2).toUpperCase()}
    </span>
  );
}

function RecentSwapRow({
  swap,
  tokens,
}: {
  readonly swap: RecentSwap;
  readonly tokens: readonly Token[];
}): React.JSX.Element {
  const fromIcon = findTokenIcon(tokens, swap.fromCoin);
  const toIcon = findTokenIcon(tokens, swap.toCoin);
  const details = [
    statusLabel(swap.status),
    swap.provider,
    `${formatAmount(swap.fromAmount)} ${swap.fromCoin} to ${formatAmount(swap.toAmount)} ${swap.toCoin}`,
    swap.amountInUsd ? `$${swap.amountInUsd} sent` : null,
    swap.expectedAmountOutUsd ? `$${swap.expectedAmountOutUsd} received` : null,
  ]
    .filter((value) => value !== null)
    .join(" · ");

  return (
    <li
      className="group grid min-h-10 grid-cols-[20px_minmax(3.7rem,1fr)_17px_12px_minmax(3.7rem,1fr)_17px_2rem] items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-bg/25"
      title={details}
    >
      <span className="relative shrink-0">
        <ProviderIcon provider={swap.provider} size={19} />
        <span
          className={`absolute -right-0.5 -bottom-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-bg ${statusDotClass(swap.status)}`}
          aria-label={statusLabel(swap.status)}
        />
      </span>

      <span className="min-w-0 truncate text-right font-mono text-[11px] font-semibold tabular-nums text-ink">
        {formatAmount(swap.fromAmount)}
      </span>
      <TokenIcon symbol={swap.fromCoin} icon={fromIcon} />
      <ArrowRight className="h-3 w-3 text-ink-dim" aria-hidden="true" />
      <span className="min-w-0 truncate text-right font-mono text-[11px] font-semibold tabular-nums text-ink">
        {formatAmount(swap.toAmount)}
      </span>
      <TokenIcon symbol={swap.toCoin} icon={toIcon} />

      <span className="justify-self-end text-right font-mono text-[9.5px] text-ink-dim">
        {shortTimeAgo(swap.timeAgo)}
      </span>
    </li>
  );
}

function RecentSwapsSkeleton(): React.JSX.Element {
  return (
    <div className="animate-pulse" aria-label="Loading recent swaps">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="mx-2 flex h-10 items-center gap-2 rounded-lg px-1">
          <div className="h-[17px] w-[17px] rounded-full bg-ink/10" />
          <div className="h-2.5 flex-1 rounded bg-ink/10" />
          <div className="h-2 w-6 rounded bg-ink/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  isError,
  onRetry,
}: {
  readonly isError: boolean;
  readonly onRetry: () => void;
}): React.JSX.Element {
  return (
    <div className="px-4 py-6 text-center">
      {isError ? (
        <>
          <AlertCircle className="mx-auto h-4 w-4 text-accent" />
          <p className="mt-2 text-[11px] text-ink-mid">Activity unavailable</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-accent hover:text-ink"
          >
            Try again
          </button>
        </>
      ) : (
        <>
          <Radio className="mx-auto h-4 w-4 text-ink-dim" />
          <p className="mt-2 text-[11px] text-ink-mid">No recent swaps yet</p>
        </>
      )}
    </div>
  );
}

export function RecentSwapsCard(): React.JSX.Element {
  const { data, isError, isLoading, refetch } = useRecent();
  const { data: tokens = [] } = useTokens();
  const swaps = (data ?? []).slice(0, MAX_VISIBLE_RECENTS);

  return (
    <article className="overflow-hidden rounded-2xl border border-line-2 bg-bg/40 p-3 backdrop-blur-md">
      <header className="pb-2 text-center">
        <h2 className="font-mono text-[11px] font-semibold tracking-[0.02em] text-ink">
          Recent swaps
        </h2>
      </header>

      {isLoading && <RecentSwapsSkeleton />}
      {!isLoading && swaps.length > 0 && (
        <ul className="no-scrollbar max-h-[300px] overflow-y-auto overscroll-contain">
          {swaps.map((swap) => (
            <RecentSwapRow key={swap.id} swap={swap} tokens={tokens} />
          ))}
        </ul>
      )}
      {!isLoading && swaps.length === 0 && (
        <EmptyState isError={isError} onRetry={() => void refetch()} />
      )}
    </article>
  );
}
