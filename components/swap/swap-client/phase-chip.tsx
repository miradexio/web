import { Check } from "lucide-react";
import type { Tone } from "./types";

type PhaseChipProps = {
  readonly tone: Tone;
  readonly label: string;
  readonly phase?: string;
};

export function PhaseChip({ tone, label, phase }: PhaseChipProps) {
  // Expired is classified as `warn` tone (the swap didn't fail per se — just
  // timed out without a deposit), but the visual signal we want is harder
  // than the warm warn-orange we use for refund. Render expired as a solid
  // red pill so the user instantly reads "this didn't happen" and not
  // "this is in progress with a hiccup".
  if (phase === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B41E28] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_1px_0_rgba(26,31,53,0.14)]">
        <span className="text-[8px]">●</span>
        {label}
      </span>
    );
  }
  if (tone === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1F6B3A]/40 bg-[#1F6B3A]/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1F6B3A]">
        <Check className="h-3 w-3" />
        {label}
      </span>
    );
  }
  if (tone === "fail") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B41E28]/40 bg-[#B41E28]/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B41E28]">
        <span className="text-[8px]">●</span>
        {label}
      </span>
    );
  }
  if (tone === "warn") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-bg shadow-[0_1px_0_rgba(26,31,53,0.14)]">
        <span className="text-[8px]">●</span>
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-bg shadow-[0_1px_0_rgba(26,31,53,0.14)]">
      <span className="ns-twinkle inline-block h-1.5 w-1.5 rounded-full bg-bg" />
      {label}
    </span>
  );
}
