import { PROVIDER_RATINGS } from "./constants";
import { gradeBadgeClass } from "./helpers";

export function ProviderRatingCard() {
  return (
    <article className="rounded-xl border border-line-2 bg-bg/40 p-4 backdrop-blur-md">
      <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent">
        Provider rating
      </div>
      <ul className="flex flex-col gap-3">
        {PROVIDER_RATINGS.map((r) => (
          <li key={r.provider} className="flex items-start gap-2.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${gradeBadgeClass(r.grade)}`}
              aria-label={`Grade ${r.grade}`}
            >
              {r.grade}
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium leading-[1.25] text-ink">
                {r.provider}
              </div>
              <p className="mt-1 text-[11.5px] leading-[1.5] text-ink-mid">{r.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
