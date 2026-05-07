"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { useSwapHistory } from "@/hooks/use-swap-history";
import { isTerminalStatus } from "@/lib/storage/swap-history";
import { HistoryModal } from "./history-modal";

export function HistoryButton(): React.JSX.Element {
  const { data = [] } = useSwapHistory();
  const [open, setOpen] = useState<boolean>(false);

  const hasActive = data.some((row) => !isTerminalStatus(row.status));
  const total = data.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-bg/40 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-mid transition-colors hover:border-line-2 hover:text-ink"
        aria-label={`Swap history${total > 0 ? ` (${total})` : ""}`}
      >
        <History className="h-3.5 w-3.5" />
        History
        {hasActive && (
          <span
            className="ns-twinkle absolute right-2 top-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green"
            aria-hidden="true"
          />
        )}
      </button>
      <HistoryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
