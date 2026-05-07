"use client";

import { ArrowLeft, X } from "lucide-react";

export interface KeystoresSheetHeaderProps {
  readonly inDetail: boolean;
  readonly onBack: () => void;
  readonly onClose: () => void;
}

export function KeystoresSheetHeader({
  inDetail,
  onBack,
  onClose,
}: KeystoresSheetHeaderProps): React.JSX.Element {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-line-2 px-5 py-4">
      <div className="flex items-center gap-2">
        {inDetail && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-mid transition-colors hover:bg-bg-2/50 hover:text-ink"
            aria-label="Back to keystores list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
          {inDetail ? "Keystore" : "Keystores"}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1.5 text-ink-mid transition-colors hover:bg-bg-2/50 hover:text-ink"
        aria-label="Close keystores"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}
