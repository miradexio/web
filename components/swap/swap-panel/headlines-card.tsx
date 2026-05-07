import { HEADLINES } from "./constants";

export function HeadlinesCard() {
  return (
    <article className="rounded-xl border border-line-2 bg-bg/40 p-4 backdrop-blur-md">
      <ul className="flex flex-col gap-2.5">
        {HEADLINES.map((h) => (
          <li key={h.label} className="flex items-center gap-2.5">
            <span
              className={`inline-block h-2 w-2 shrink-0 rounded-full ${h.dot}`}
              aria-hidden="true"
            />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
              {h.label}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
