import { X } from "lucide-react";
import { PROTOCOL_OPTIONS, SORT_OPTIONS } from "./constants";
import { ProviderIcon } from "./provider-icon";
import type { ProtocolFilter, SortMode } from "./types";

type SortFilterPopoverProps = {
  readonly sortMode: SortMode;
  readonly protocolFilter: ProtocolFilter;
  readonly onSortChange: (m: SortMode) => void;
  readonly onProtocolChange: (p: ProtocolFilter) => void;
  readonly onClose: () => void;
};

export function SortFilterPopover({
  sortMode,
  protocolFilter,
  onSortChange,
  onProtocolChange,
  onClose,
}: SortFilterPopoverProps) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-9 z-40 w-[260px] rounded-xl border border-line-2 bg-bg/95 p-4 backdrop-blur-md shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-[14px] font-semibold text-ink">Smart sort</h4>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mid">
              Sort &amp; filter routes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-mid transition-colors hover:bg-ink/10 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSortChange(opt.id)}
              className={
                sortMode === opt.id
                  ? "rounded-full border border-accent/50 bg-accent/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent"
                  : "rounded-full border border-line-2 bg-bg/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mid transition-colors hover:text-ink"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
            Prioritize protocol
          </p>
          <ul className="flex flex-col gap-0.5">
            {PROTOCOL_OPTIONS.map((p) => {
              const active = p.id === protocolFilter;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onProtocolChange(p.id)}
                    className={
                      active
                        ? "flex w-full items-center gap-3 rounded-lg border border-accent/30 bg-accent/8 px-2.5 py-2 text-left text-[13px] font-medium text-ink"
                        : "flex w-full items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] text-ink-mid transition-colors hover:bg-bg-2/40 hover:text-ink"
                    }
                  >
                    {p.id !== "all" ? (
                      <ProviderIcon provider={p.id} size={20} />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/10 text-[10px] font-bold text-ink-mid">
                        ⊕
                      </span>
                    )}
                    {p.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
