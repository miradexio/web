import { useState } from "react";
import { ChevIcon } from "../../web-components/icons";
import { formatNumber, formatUsd } from "../../web-components/swap-shared";
import { getProviderDisplay, humanizeEta } from "./helpers";
import { ProviderIcon } from "./provider-icon";
import type { ProviderGroup } from "./types";

type OtherRoutesListProps = {
  readonly providers: readonly ProviderGroup[];
  readonly toCoin: string;
  readonly onSelect: (id: string) => void;
};

export function OtherRoutesList({ providers, toCoin, onSelect }: OtherRoutesListProps) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-xl border border-line-2 bg-bg/40 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-2 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-mid transition-colors hover:text-ink"
      >
        <ChevIcon />
        {expanded ? "Hide alternatives" : "Show alternatives"}
      </button>

      {expanded && (
        <div className="flex flex-col gap-1 border-t border-line p-2">
          {providers.map((p) => {
            const display = getProviderDisplay(p.name);
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onSelect(`${p.best.provider}-${p.best.variantId}`)}
                className="flex items-center justify-between gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-bg/40"
              >
                <div className="flex items-center gap-2.5">
                  <ProviderIcon provider={p.name} size={26} />
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{display.label}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-ink-mid">
                      {humanizeEta(p.best)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[12px] font-medium text-ink">
                    {formatNumber(p.best.toAmount, 4)} <span className="text-ink-mid">{toCoin}</span>
                  </div>
                  {p.best.toAmountUsd && (
                    <div className="font-mono text-[10px] text-ink-mid">
                      {formatUsd(p.best.toAmountUsd)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
