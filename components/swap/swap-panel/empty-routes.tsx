import { PROTOCOL_OPTIONS } from "./constants";
import type { ProtocolFilter } from "./types";

type EmptyRoutesProps = {
  readonly isLoading: boolean;
  readonly protocolFilter: ProtocolFilter;
  readonly onResetFilter: () => void;
};

export function EmptyRoutes({ isLoading, protocolFilter, onResetFilter }: EmptyRoutesProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-line-2 bg-bg/40 p-5 text-center backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mid">
          Loading quotes...
        </p>
      </div>
    );
  }
  if (protocolFilter !== "all") {
    const label = PROTOCOL_OPTIONS.find((p) => p.id === protocolFilter)?.label ?? protocolFilter;
    return (
      <div className="rounded-xl border border-line-2 bg-bg/40 p-5 text-center backdrop-blur-md">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mid">
          No routes via {label} for this pair
        </p>
        <button
          type="button"
          onClick={onResetFilter}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent/20"
        >
          Show all protocols
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-line-2 bg-bg/40 p-5 text-center backdrop-blur-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mid">
        No routes available
      </p>
    </div>
  );
}
