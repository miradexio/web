import { formatNumber, formatUsd } from "../../web-components/swap-shared";
import { Chip } from "./chip";
import { TAG_PRIORITY } from "./constants";
import { getProviderDisplay, humanizeEta } from "./helpers";
import { ProviderIcon } from "./provider-icon";
import { TagBadge } from "./tag-badge";
import type { RouteTag } from "./types";
import type { Quote } from "../../web-components/types";

type SelectedRouteCardProps = {
  readonly quote: Quote;
  readonly toCoin: string;
  readonly tags: ReadonlySet<RouteTag>;
};

const ETA_TITLE = "Estimated end to end — most of it is the source chain's own confirmation time";
const IMPACT_TITLE = "Quoted output vs the current market rate, all fees included";

function impactVariant(impactAbs: number): "neutral" | "warn" | "impact" {
  if (impactAbs < 1) return "neutral";
  if (impactAbs < 3) return "warn";
  return "impact";
}

export function SelectedRouteCard({ quote, toCoin, tags }: SelectedRouteCardProps) {
  const display = getProviderDisplay(quote.provider);
  const variantTag =
    quote.variantLabel && quote.variantLabel.toLowerCase() !== "regular"
      ? quote.variantLabel
      : null;
  const impact = quote.priceImpactPct ? parseFloat(quote.priceImpactPct) : null;
  const activeTags = TAG_PRIORITY.filter((t) => tags.has(t));

  return (
    <div className="relative mt-1 rounded-2xl border border-line-2 bg-bg/60 p-4 backdrop-blur-md">
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-green/50 bg-bg/95 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-green backdrop-blur">
        Selected route
      </div>

      <div className="mt-1 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ProviderIcon provider={quote.provider} size={32} />
          <div>
            <div className="text-[15px] font-semibold text-ink">{display.label}</div>
            <div className="mt-0.5 font-mono text-[10px] text-ink-mid" title={ETA_TITLE}>
              {humanizeEta(quote)}
            </div>
          </div>
        </div>
        {variantTag && (
          <span className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
            {variantTag}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
          {formatNumber(quote.toAmount, 6)} {toCoin}
        </div>
        {quote.toAmountUsd && (
          <div className="mt-0.5 font-mono text-[11px] text-ink-mid">
            {formatUsd(quote.toAmountUsd)}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        <Chip variant="time" title={ETA_TITLE}>
          {humanizeEta(quote)}
        </Chip>
        {impact !== null && !Number.isNaN(impact) && (
          <Chip variant={impactVariant(Math.abs(impact))} title={IMPACT_TITLE}>
            {impact > 0 ? "+" : ""}
            {impact.toFixed(2)}% vs market
          </Chip>
        )}
      </div>

      {activeTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeTags.map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
        </div>
      )}
    </div>
  );
}
