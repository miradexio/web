"use client";

const TRUSTPILOT_URL =
  process.env.NEXT_PUBLIC_TRUSTPILOT_URL ?? "https://www.trustpilot.com/review/miradex.io";
const TRUSTPILOT_RATING = process.env.NEXT_PUBLIC_TRUSTPILOT_RATING ?? "4.2";

const MAX_RATING = 5;
const TRUSTPILOT_GREEN = "#00B67A";

type StarTileProps = {
  readonly fillPercent: number;
};

function clampRating(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), MAX_RATING);
}

function starFillPercent(rating: number, index: number): number {
  const fill = Math.min(Math.max(rating - index, 0), 1);
  return fill * 100;
}

function StarIcon({ className }: { readonly className?: string }): React.JSX.Element {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="m12 17.27 5.18 3.13-1.37-5.89 4.57-3.96-6.02-.51L12 4.5 9.64 10.04l-6.02.51 4.57 3.96-1.37 5.89L12 17.27Z" />
    </svg>
  );
}

function StarTile({ fillPercent }: StarTileProps): React.JSX.Element {
  return (
    <span className="relative flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-[2px] bg-ink/18">
      <span
        className="absolute inset-y-0 left-0"
        style={{ width: `${fillPercent}%`, backgroundColor: TRUSTPILOT_GREEN }}
      />
      <StarIcon className="relative z-10 text-white" />
    </span>
  );
}

function TrustpilotLogo(): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink">
      <StarIcon className="h-4 w-4 text-[#00B67A]" />
      <span>Trustpilot</span>
    </span>
  );
}

export function TrustpilotCard(): React.JSX.Element {
  const rating = clampRating(TRUSTPILOT_RATING);
  const formattedRating = rating.toFixed(1);

  return (
    <a
      href={TRUSTPILOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Miradex is rated ${formattedRating} out of 5 stars on Trustpilot`}
      className="mt-1 block rounded-xl border border-line-2 bg-bg/40 px-4 py-3 text-ink backdrop-blur-md transition-colors hover:border-[#00B67A]/45 hover:bg-bg/55"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold leading-5">Rated {formattedRating}/5</div>
        </div>
        <TrustpilotLogo />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((index) => (
            <StarTile key={index} fillPercent={starFillPercent(rating, index)} />
          ))}
        </div>
        <span className="font-mono text-[12px] font-semibold text-ink">miradex.io</span>
      </div>
    </a>
  );
}
