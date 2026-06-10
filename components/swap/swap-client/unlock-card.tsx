"use client";

import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";

type UnlockCardProps = {
  readonly onUnlock: (destAddress: string) => Promise<void>;
  readonly onSkip: () => void;
  readonly mismatch: boolean;
};

export function UnlockCard({ onUnlock, onSkip, mismatch }: UnlockCardProps) {
  const [address, setAddress] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const trimmed = address.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const submit = async (): Promise<void> => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onUnlock(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="rounded-2xl border border-line-2 bg-bg/40 p-5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <LockKeyhole className="h-3.5 w-3.5 text-ink-dim" />
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-mid">
          Limited view
        </span>
      </div>
      <p className="mt-2 font-mono text-[12px] leading-[1.5] text-ink-mid">
        This swap is shown without addresses or transaction details. Enter the
        swap&apos;s receive (destination) address to unlock the full view.
      </p>
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Destination address"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-[10px] border border-line-2 bg-bg-2/60 px-3 py-2.5 font-mono text-[12px] text-ink placeholder:text-ink-dim focus:border-ink/50 focus:outline-none"
        />
        {mismatch && (
          <p className="font-mono text-[11px] leading-[1.5] text-destructive">
            Address doesn&apos;t match this swap.
          </p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-bg/30 px-4 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
            Unlock
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center rounded-full px-4 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-dim transition-colors hover:text-ink"
          >
            Skip
          </button>
        </div>
      </form>
    </article>
  );
}
