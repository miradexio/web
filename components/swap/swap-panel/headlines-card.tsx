import { HEADLINES } from "./constants";
import { ProviderIcon } from "./provider-icon";

const HEADLINE_PROVIDERS = ["atomicswap", "thorchain", "chainflip", "near_intents"] as const;

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
      <div className="mt-3 grid grid-cols-4 items-center border-t border-line pt-3">
        {HEADLINE_PROVIDERS.map((provider) => (
          <span key={provider} className="flex justify-center">
            <ProviderIcon provider={provider} size={20} />
          </span>
        ))}
      </div>
    </article>
  );
}
