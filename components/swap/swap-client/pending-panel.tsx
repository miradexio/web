import { Loader2 } from "lucide-react";
import { humanizePhase } from "./format";

type PendingPanelProps = {
  readonly message: string | null;
  readonly phase: string;
};

export function PendingPanel({ message, phase }: PendingPanelProps) {
  return (
    <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
      <div className="flex items-center gap-2.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-bg/65" />
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-bg/70">
          {humanizePhase(phase)}
        </span>
      </div>
      {message && (
        <p className="mt-2 font-mono text-[12px] leading-[1.5] text-bg/70">{message}</p>
      )}
    </div>
  );
}
