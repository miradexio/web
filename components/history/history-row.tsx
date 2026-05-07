"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  formatAmount,
  formatExpiresIn,
  formatUsd,
} from "./format";
import {
  statusDescriptor,
  statusDotClass,
  statusToneClass,
} from "./phase-label";
import { TokenGlyph } from "./token-glyph";
import { DeleteConfirm } from "./delete-confirm";
import { isTerminalStatus, type SwapHistoryRow } from "@/lib/storage/swap-history";

const COUNTDOWN_TICK_MS = 30_000;

type HistoryRowProps = {
  readonly row: SwapHistoryRow;
  readonly onDelete: (flowId: string) => Promise<void>;
  readonly onNavigate: (flowId: string) => void;
};

export function HistoryRowItem({ row, onDelete, onNavigate }: HistoryRowProps): React.JSX.Element {
  const [now, setNow] = useState<number>(() => Date.now());
  const [confirming, setConfirming] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (row.expiresAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS);
    return () => window.clearInterval(id);
  }, [row.expiresAt]);

  const status = statusDescriptor(row.status);
  const isActive = !isTerminalStatus(row.status);
  const expiresIn = isActive ? formatExpiresIn(row.expiresAt, now) : null;

  const handleConfirm = async (): Promise<void> => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete(row.flowId);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <article
      className="relative flex flex-col gap-2.5 rounded-xl border border-line-2 bg-bg/40 p-3.5 backdrop-blur-md transition-colors hover:bg-bg/60"
    >
      <button
        type="button"
        onClick={() => onNavigate(row.flowId)}
        className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 text-left"
        aria-label={`Open swap ${row.flowId}`}
      >
        <div className="flex items-center gap-2.5">
          <TokenGlyph symbol={row.fromCoin} />
          <div className="min-w-0">
            <div className="truncate font-mono text-[13px] font-semibold text-ink">
              {formatAmount(row.fromAmount, 8)} {row.fromCoin}
            </div>
            <div className="font-mono text-[10.5px] text-ink-dim">
              {formatUsd(row.fromAmountUsd)}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotClass(status.tone)}`}
            aria-hidden="true"
          />
          <span
            className={`font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] ${statusToneClass(status.tone)}`}
          >
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5 justify-self-end text-right">
          <div className="min-w-0">
            <div className="truncate font-mono text-[13px] font-semibold text-ink">
              {formatAmount(row.toAmount, 6)} {row.toCoin}
            </div>
            <div className="font-mono text-[10.5px] text-ink-dim">
              {formatUsd(row.toAmountUsd)}
            </div>
          </div>
          <TokenGlyph symbol={row.toCoin} />
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-line pt-2.5">
        {expiresIn !== null ? (
          <span className="font-mono text-[10.5px] text-ink-mid">
            Expires in <span className="text-ink">{expiresIn}</span>
          </span>
        ) : (
          <span className="font-mono text-[10.5px] text-ink-dim capitalize">
            via {row.provider.replace(/_/g, " ")}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate(row.flowId)}
            className="rounded-md px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent/10"
          >
            Show details
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B]"
            aria-label="Delete swap"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {confirming && (
        <DeleteConfirm
          flowId={row.flowId}
          isActive={isActive}
          isDeleting={deleting}
          onCancel={() => setConfirming(false)}
          onConfirm={handleConfirm}
        />
      )}
    </article>
  );
}
