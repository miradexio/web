"use client";

import { Trash2 } from "lucide-react";
import type { KeystoreMetadata } from "@miradexio/client";
import { truncateMiddle } from "@/components/swap/swap-client/format";

export interface KeystoresSheetConfirmDeleteProps {
  readonly keystore: KeystoreMetadata;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

// Renders inside the sheet at z-[70] (sheet is z-50) so the backdrop dim
// only covers the sheet body — avoids double-dimming the page.
export function KeystoresSheetConfirmDelete({
  keystore,
  busy,
  onCancel,
  onConfirm,
}: KeystoresSheetConfirmDeleteProps): React.JSX.Element {
  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="relative w-full max-w-[420px] rounded-2xl border border-bg/15 bg-surface p-5 text-bg shadow-2xl">
        <h3 id="confirm-delete-title" className="text-[16px] font-semibold leading-tight">
          Delete this keystore?
        </h3>
        <p className="mt-1.5 truncate font-mono text-[10.5px] text-bg/70">
          {truncateMiddle(keystore.btcAddress, 12, 10)}
          {keystore.swapId && <> · {keystore.swapId}</>}
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg border border-bg/20 bg-bg/[0.05] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg/70 transition-colors hover:bg-bg/[0.10] hover:text-bg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B41E28] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
