"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

type DeleteConfirmProps = {
  readonly flowId: string;
  readonly isActive: boolean;
  readonly isDeleting: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export function DeleteConfirm({
  flowId,
  isActive,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmProps): React.JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, isDeleting]);

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-stretch justify-center gap-3 rounded-xl border border-[#FF6B6B]/40 bg-bg p-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`delete-${flowId}-title`}
      aria-describedby={`delete-${flowId}-body`}
    >
      <div>
        <h4
          id={`delete-${flowId}-title`}
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF6B6B]"
        >
          Delete this swap?
        </h4>
        <p
          id={`delete-${flowId}-body`}
          className="mt-1.5 text-[12.5px] leading-[1.5] text-ink-mid"
        >
          {isActive
            ? "The swap will be cancelled and removed from your history. Funds you've already sent will follow the protocol's refund path."
            : "This removes the swap from your history. The on-chain record stays intact."}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="rounded-lg border border-line-2 bg-bg/40 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mid transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF6B6B]/50 bg-[#FF6B6B]/15 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF6B6B] transition-colors hover:bg-[#FF6B6B]/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  );
}
