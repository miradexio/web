import { formatNumber, formatUsd } from "../../web-components/swap-shared";
import { getProviderDisplay, humanizeEta } from "./helpers";
import type { Quote } from "../../web-components/types";

type SwapModeComparisonProps = {
  readonly providerName: string;
  readonly variants: readonly Quote[];
  readonly selectedQuoteId: string | undefined;
  readonly onSelect: (id: string) => void;
  readonly toCoin: string;
};

const USD_DIFF_VISIBILITY_THRESHOLD = 0.01;

interface VariantDelta {
  readonly usd: number | null;
  readonly seconds: number | null;
}

function computeDelta(variant: Quote, best: Quote): VariantDelta {
  const usd =
    variant.toAmountUsd && best.toAmountUsd
      ? parseFloat(variant.toAmountUsd) - parseFloat(best.toAmountUsd)
      : null;
  const seconds =
    variant.estimatedDurationSeconds !== undefined &&
    best.estimatedDurationSeconds !== undefined
      ? variant.estimatedDurationSeconds - best.estimatedDurationSeconds
      : null;
  return { usd, seconds };
}

function formatDelta(delta: VariantDelta): string | null {
  const parts: string[] = [];
  if (delta.usd !== null && Math.abs(delta.usd) >= USD_DIFF_VISIBILITY_THRESHOLD) {
    const sign = delta.usd > 0 ? "+" : "−";
    parts.push(
      `${sign}$${Math.abs(delta.usd).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    );
  }
  if (delta.seconds !== null && delta.seconds !== 0) {
    const sign = delta.seconds > 0 ? "+" : "−";
    parts.push(`${sign}${String(Math.abs(Math.round(delta.seconds)))}s`);
  }
  return parts.length === 0 ? null : parts.join(" · ");
}

export function SwapModeComparison({
  providerName,
  variants,
  selectedQuoteId,
  onSelect,
  toCoin,
}: SwapModeComparisonProps) {
  const display = getProviderDisplay(providerName);
  const best = variants[0];
  if (!best) return null;

  // ≤2 variants → 2-column grid with the larger card layout (one row total).
  // >2 variants → switch to a tighter one-per-row stack inside a bounded
  // scrollable container, so the card stays the same height regardless of
  // how many makers are online.
  const isScrollable = variants.length > 2;
  const listClass = isScrollable
    ? "flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1.5 [scrollbar-gutter:stable]"
    : "grid grid-cols-2 gap-2";

  return (
    <div className="rounded-xl border border-line-2 bg-bg/40 p-3.5 backdrop-blur-md">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mid">
          Swap mode <span className="text-ink-dim">via {display.label}</span>
        </span>
        {isScrollable && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">
            {variants.length} options
          </span>
        )}
      </div>

      <div className={isScrollable ? "relative" : ""}>
        <div className={listClass}>
        {variants.map((v, idx) => {
          const id = `${v.provider}-${v.variantId}`;
          const isActive = id === selectedQuoteId;
          const isBest = idx === 0;
          const deltaText = isBest ? null : formatDelta(computeDelta(v, best));
          if (isScrollable) {
            // Compact single-row layout used when the list scrolls. Same data
            // as the larger card, just laid out left-to-right so rows are
            // short enough to fit several in the bounded scroll area.
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={
                  isActive
                    ? "flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-2 text-left transition-colors"
                    : "flex items-center justify-between gap-3 rounded-lg border border-line-2 bg-bg/30 px-2.5 py-2 text-left transition-colors hover:border-line-2 hover:bg-bg/50"
                }
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={`truncate font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      isActive ? "text-accent" : "text-ink-mid"
                    }`}
                  >
                    {v.variantLabel || "Regular"}
                  </span>
                  {isBest && (
                    <span className="shrink-0 rounded-full border border-green/40 bg-green/12 px-1.5 py-px font-mono text-[8.5px] font-semibold uppercase tracking-[0.14em] text-green">
                      Best
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-baseline gap-2 text-right">
                  <span className="font-mono text-[12px] font-medium text-ink">
                    {formatNumber(v.toAmount, 4)} <span className="text-ink-mid">{toCoin}</span>
                  </span>
                  {v.toAmountUsd && (
                    <span className="font-mono text-[10px] text-ink-mid">
                      {formatUsd(v.toAmountUsd)}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-ink-mid">{humanizeEta(v)}</span>
                  {deltaText && (
                    <span className="font-mono text-[9px] text-ink-dim">{deltaText}</span>
                  )}
                </div>
              </button>
            );
          }
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={
                isActive
                  ? "flex flex-col gap-1.5 rounded-lg border border-accent/40 bg-accent/10 p-2.5 text-left transition-colors"
                  : "flex flex-col gap-1.5 rounded-lg border border-line-2 bg-bg/30 p-2.5 text-left transition-colors hover:border-line-2 hover:bg-bg/50"
              }
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] ${
                    isActive ? "text-accent" : "text-ink-mid"
                  }`}
                >
                  {v.variantLabel || "Regular"}
                </span>
                {isBest && (
                  <span className="rounded-full border border-green/40 bg-green/12 px-1.5 py-px font-mono text-[8.5px] font-semibold uppercase tracking-[0.14em] text-green">
                    Best
                  </span>
                )}
              </div>
              <div className="font-mono text-[13px] font-medium text-ink">
                {formatNumber(v.toAmount, 4)} <span className="text-ink-mid">{toCoin}</span>
              </div>
              {v.toAmountUsd && (
                <div className="font-mono text-[10px] text-ink-mid">{formatUsd(v.toAmountUsd)}</div>
              )}
              <div className="flex items-baseline justify-between gap-1.5">
                <span className="font-mono text-[10px] text-ink-mid">{humanizeEta(v)}</span>
                {deltaText && (
                  <span className="font-mono text-[9px] text-ink-dim">{deltaText}</span>
                )}
              </div>
            </button>
          );
        })}
        </div>
        {isScrollable && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-bg/85 to-transparent"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
