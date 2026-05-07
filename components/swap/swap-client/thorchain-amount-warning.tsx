import { AlertTriangle, Check, Pencil } from "lucide-react";

type ThorchainAmountWarningProps = {
  readonly depositAmount: string;
  readonly fromToken: string;
  readonly acked: boolean;
  readonly onToggleAck: () => void;
};

export function ThorchainAmountWarning({
  depositAmount,
  fromToken,
  acked,
  onToggleAck,
}: ThorchainAmountWarningProps) {
  const exactLine = `EXACTLY ${depositAmount} ${fromToken}`;

  if (acked) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-bg/15 bg-[#D8C8A2] px-3.5 py-2.5">
        <Check className="h-3.5 w-3.5 shrink-0 text-[#1F6B3A]" aria-hidden="true" />
        <span className="flex-1 truncate font-mono text-[11.5px] text-bg/75">
          Acknowledged — send <span className="font-semibold text-bg">{exactLine}</span>.
        </span>
        <button
          type="button"
          onClick={onToggleAck}
          className="inline-flex items-center gap-1 rounded-md border border-bg/20 bg-bg/[0.05] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-bg/70 transition-colors hover:bg-bg/[0.10] hover:text-bg"
          aria-label="Re-confirm amount"
        >
          <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
          Edit
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggleAck}
      aria-pressed={false}
      className="flex w-full items-center gap-2.5 rounded-xl border-[1.5px] border-[#C2611B] bg-[#F0DCB4] px-3.5 py-2.5 text-left transition-colors hover:bg-[#E8D2A4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2611B]/60"
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-[#C2611B] bg-surface/60"
        aria-hidden="true"
      />
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#C2611B]" aria-hidden="true" />
      <span className="flex-1 font-mono text-[11.5px] leading-[1.4] text-bg">
        I&apos;ll send <span className="font-semibold">{exactLine}</span>.{" "}
        <span className="text-bg/70">Wrong amount autorefunds minus fees.</span>
      </span>
    </button>
  );
}
