import { QUOTE_REFRESH_SECONDS } from "./constants";

type RefreshArcProps = {
  readonly seconds: number;
};

export function RefreshArc({ seconds }: RefreshArcProps) {
  const pct = Math.max(0, Math.min(1, seconds / QUOTE_REFRESH_SECONDS));
  const radius = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r={radius} fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.25" />
      <circle
        cx="7"
        cy="7"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 7 7)"
        style={{ transition: "stroke-dashoffset 0.5s linear" }}
      />
    </svg>
  );
}
