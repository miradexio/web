import { REVIEW_LINKS } from "./review-links";

type IconProps = {
  readonly className?: string;
};

function XIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.27 1.5h2.3l-5.03 5.74L15.5 14.5h-4.63L7.24 9.78 3.1 14.5H.79l5.38-6.14L.5 1.5h4.75l3.27 4.32L12.27 1.5zm-.81 11.62h1.27L4.6 2.81H3.24l8.22 10.31z" />
    </svg>
  );
}

function BitcoinTalkIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 1a7 7 0 0 0-5.74 11.02L1.5 15l3.07-.67A7 7 0 1 0 8 1zm1.18 7.6c.4-.18.7-.5.7-.96 0-.84-.7-1.16-1.7-1.22V5.2H7.5v1.2H6.9V5.2h-.7v1.2H4.7v.8h.42c.27 0 .35.16.35.36v3c0 .2-.08.36-.35.36H4.7v.8h1.5v1.2h.7v-1.2h.6v1.2h.68v-1.2c1.18-.06 2.02-.46 2.02-1.42 0-.7-.5-1.06-1.02-1.16zM6.86 7.18c.5 0 1.5 0 1.5.7 0 .68-1 .68-1.5.68V7.18zm0 3.66V9.36c.6 0 1.78 0 1.78.74s-1.18.74-1.78.74z" />
    </svg>
  );
}

function KycNotIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 1.5L2.5 3.6v3.7c0 3.1 2.4 6 5.5 7.2 3.1-1.2 5.5-4.1 5.5-7.2V3.6L8 1.5z" />
      <path d="M3.2 3.2l9.6 9.6" />
    </svg>
  );
}

function MonericaIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 1.2A6.8 6.8 0 0 0 1.2 8c0 .8.14 1.56.4 2.27h2.06V5.2L8 9.34l4.34-4.14v5.07h2.06A6.8 6.8 0 0 0 8 1.2zM3.66 11.5a6.8 6.8 0 0 0 8.68 0h-2.18V8.32L8 10.5 5.84 8.32V11.5H3.66z" />
    </svg>
  );
}

function TrustpilotIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 1.5l1.96 4.27 4.54.55-3.36 3.13.88 4.55L8 11.78l-4.02 2.22.88-4.55L1.5 6.32l4.54-.55L8 1.5z" />
    </svg>
  );
}

function CryptwerkIcon({ className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 1L1.5 4.5v7L8 15l6.5-3.5v-7L8 1zm0 1.6l4.6 2.48-4.6 2.48L3.4 5.08 8 2.6zM2.7 6.16l4.7 2.54v4.92L2.7 11.08V6.16zm6 7.46V8.7l4.7-2.54v4.92L8.7 13.62z" />
    </svg>
  );
}

const ICONS: Readonly<Record<string, (props: IconProps) => React.JSX.Element>> = {
  X: XIcon,
  BitcoinTalk: BitcoinTalkIcon,
  KYCnot: KycNotIcon,
  Monerica: MonericaIcon,
  Trustpilot: TrustpilotIcon,
  Cryptwerk: CryptwerkIcon,
};

function iconFor(label: string): (props: IconProps) => React.JSX.Element {
  const Icon = ICONS[label];
  if (Icon === undefined) {
    throw new Error(`No icon registered for review link "${label}"`);
  }
  return Icon;
}

export function ReviewLinksCard(): React.JSX.Element {
  return (
    <section className="rounded-xl border border-line-2 bg-bg/40 p-4 backdrop-blur-md">
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink">
        Enjoyed the swap?
      </div>
      <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-mid">
        Leave a review
      </p>
      <nav aria-label="Review Miradex" className="mt-3 flex flex-wrap gap-2">
        {REVIEW_LINKS.map(({ label, url }) => {
          const Icon = iconFor(label);
          return (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-bg/30 px-3 py-1.5 font-mono text-[11px] text-ink/80 transition-colors hover:border-ink/40 hover:bg-bg/50 hover:text-ink"
            >
              <Icon className="text-ink-mid transition-colors group-hover:text-ink" />
              <span>{label}</span>
            </a>
          );
        })}
      </nav>
    </section>
  );
}
