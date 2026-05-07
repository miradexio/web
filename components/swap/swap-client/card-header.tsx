import { Check, Copy } from "lucide-react";
import { humanizePhase } from "./format";
import { PhaseChip } from "./phase-chip";
import type { Tone } from "./types";

type CardHeaderProps = {
  readonly phase: string;
  readonly tone: Tone;
  // Server swap number (e.g. MIRA-VL2DL77D). Null pre-/swap/new — chip shows
  // PENDING and the copy button is disabled. keystoreId is deliberately
  // never displayed: it's a wallet handle, not a swap identity.
  readonly swapNumber: string | null;
  readonly onCopy: (value: string, key: string) => void;
  readonly copiedKey: string | null;
};

export function CardHeader({
  phase,
  tone,
  swapNumber,
  onCopy,
  copiedKey,
}: CardHeaderProps) {
  const isPending = swapNumber === null;
  const display = isPending ? "PENDING" : swapNumber;
  const copied = copiedKey === "swap-id";

  return (
    <header className="flex items-center justify-between gap-3 px-1">
      <button
        type="button"
        disabled={isPending}
        onClick={isPending ? undefined : () => onCopy(swapNumber, "swap-id")}
        className={`inline-flex items-center gap-1.5 rounded-full border border-bg/15 bg-bg/[0.04] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg transition-colors ${
          isPending
            ? "opacity-60"
            : "hover:bg-bg/[0.08]"
        }`}
        aria-label={isPending ? "Swap pending" : "Copy swap id"}
        title={isPending ? undefined : "Click to copy"}
      >
        <span>{display}</span>
        {!isPending &&
          (copied ? (
            <Check className="h-3 w-3 text-[#1F6B3A]" />
          ) : (
            <Copy className="h-3 w-3 text-bg/55" />
          ))}
      </button>
      <PhaseChip tone={tone} label={humanizePhase(phase)} phase={phase} />
    </header>
  );
}
