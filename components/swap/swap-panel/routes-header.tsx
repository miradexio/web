import { useEffect, useState } from "react";
import { ListFilter } from "lucide-react";
import { QUOTE_REFRESH_SECONDS } from "./constants";
import { RefreshArc } from "./refresh-arc";
import { SortFilterPopover } from "./sort-filter-popover";
import type { ProtocolFilter, SortMode } from "./types";

type RoutesHeaderProps = {
  readonly count: number;
  readonly lastUpdated: number;
  readonly sortMode: SortMode;
  readonly protocolFilter: ProtocolFilter;
  readonly onSortChange: (m: SortMode) => void;
  readonly onProtocolChange: (p: ProtocolFilter) => void;
  readonly showSort: boolean;
  readonly onToggleSort: () => void;
  readonly onCloseSort: () => void;
};

export function RoutesHeader({
  count,
  lastUpdated,
  sortMode,
  protocolFilter,
  onSortChange,
  onProtocolChange,
  showSort,
  onToggleSort,
  onCloseSort,
}: RoutesHeaderProps) {
  const [secondsLeft, setSecondsLeft] = useState(QUOTE_REFRESH_SECONDS);

  useEffect(() => {
    const tick = (): void => {
      const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
      setSecondsLeft(Math.max(0, QUOTE_REFRESH_SECONDS - elapsed));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  return (
    <div className="relative flex items-center justify-between px-1">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
        Routes
      </span>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-mid">
          <RefreshArc seconds={secondsLeft} />
          <span>{secondsLeft}s</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mid">
          {count} found
        </span>
        <button
          type="button"
          onClick={onToggleSort}
          className="flex items-center gap-1.5 rounded-md border border-line-2 bg-bg/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-bg/60"
          aria-expanded={showSort}
        >
          <ListFilter className="h-3 w-3" />
          Sort
        </button>
      </div>

      {showSort && (
        <SortFilterPopover
          sortMode={sortMode}
          protocolFilter={protocolFilter}
          onSortChange={onSortChange}
          onProtocolChange={onProtocolChange}
          onClose={onCloseSort}
        />
      )}
    </div>
  );
}
