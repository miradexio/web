"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useDeleteSwap, useSwapHistory } from "@/hooks/use-swap-history";
import type { SwapHistoryRow } from "@/lib/storage/swap-history";
import { dateGroupLabel } from "./format";
import { HistoryRowItem } from "./history-row";

type HistoryModalProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

interface HistoryGroup {
  readonly label: string;
  readonly rows: readonly SwapHistoryRow[];
}

function groupByDate(rows: readonly SwapHistoryRow[]): readonly HistoryGroup[] {
  const now = new Date();
  const seen = new Map<string, SwapHistoryRow[]>();
  for (const row of rows) {
    const label = dateGroupLabel(row.createdAt, now);
    const list = seen.get(label) ?? [];
    list.push(row);
    seen.set(label, list);
  }
  return [...seen.entries()].map(([label, group]) => ({ label, rows: group }));
}

export function HistoryModal({ open, onClose }: HistoryModalProps): React.JSX.Element | null {
  const { data = [] } = useSwapHistory();
  const deleteSwap = useDeleteSwap();
  const router = useRouter();
  const groups = useMemo(() => groupByDate(data), [data]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const handleNavigate = (flowId: string): void => {
    onClose();
    // Prefer the canonical ?id=<serverSwapId> URL when the row has it.
    // Falls back to ?keystore=<flowId> for atomic rows that haven't reached
    // /swap/new yet (server hasn't issued a number).
    const row = data.find((r) => r.flowId === flowId);
    const serverId = row?.serverSwapId;
    if (serverId && serverId.length > 0) {
      router.push(`/?id=${encodeURIComponent(serverId)}`);
    } else {
      router.push(`/?keystore=${encodeURIComponent(flowId)}`);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Swap history"
    >
      <div
        className="relative flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-line-2 bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line-2 px-5 py-4">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">History</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-mid transition-colors hover:bg-bg-2/50 hover:text-ink"
            aria-label="Close history"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-y-auto p-4">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-dim">
                No swaps yet
              </p>
              <p className="text-[12px] text-ink-mid">
                Once you start a swap, it shows up here.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {groups.map((group) => (
                <li key={group.label} className="flex flex-col gap-2">
                  <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
                    {group.label}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {group.rows.map((row) => (
                      <li key={row.flowId}>
                        <HistoryRowItem
                          row={row}
                          onDelete={deleteSwap}
                          onNavigate={handleNavigate}
                        />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
