import { TAG_STYLES } from "./constants";
import type { RouteTag } from "./types";

type TagBadgeProps = {
  readonly tag: RouteTag;
};

export function TagBadge({ tag }: TagBadgeProps) {
  const { label, cls } = TAG_STYLES[tag];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}
    >
      <span className="text-[8px]">●</span>
      {label}
    </span>
  );
}
