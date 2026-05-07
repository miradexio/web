import type { ReactNode } from "react";

type ChipVariant = "neutral" | "fee" | "time" | "impact";

const VARIANT_CLASSES: Readonly<Record<ChipVariant, string>> = {
  neutral: "border-line-2 bg-bg/40 text-ink-mid",
  fee: "border-green/40 bg-green/12 text-green",
  time: "border-[#E8C25A]/40 bg-[#E8C25A]/12 text-[#E8C25A]",
  impact: "border-[#FF6B6B]/40 bg-[#FF6B6B]/12 text-[#FF6B6B]",
};

type ChipProps = {
  readonly children: ReactNode;
  readonly variant?: ChipVariant;
};

export function Chip({ children, variant = "neutral" }: ChipProps) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
