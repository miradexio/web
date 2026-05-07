import Image from "next/image";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import type { VerificationCheck, VerificationResult } from "@miradexio/client";
import { providerLabel, providerLogo } from "./provider";

type VerificationCardProps = {
  readonly verification: VerificationResult | null;
  readonly provider: string | null;
  readonly sourceUrl: string | null;
  readonly isActive: boolean;
};

export function VerificationCard({
  verification,
  provider,
  sourceUrl,
  isActive,
}: VerificationCardProps) {
  if (verification === null) {
    if (!isActive) return null;
    return (
      <section className="rounded-xl border border-line-2 bg-bg/40 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink">
            Verification
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mid">
            <Loader2 className="h-3 w-3 animate-spin" />
            Pending
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-[1.5] text-ink-mid">
          Waiting on your deposit. Verification happens locally before any signing — your BTC in the keystore stays put unless every check passes.
        </p>
      </section>
    );
  }

  const passed = verification.checks.filter((c: VerificationCheck) => c.passed).length;
  const total = verification.checks.length;
  const allPassed = verification.verified;
  const headerProvider = provider ?? verification.provider;
  const headerLabel = providerLabel(headerProvider);
  const headerLogo = providerLogo(headerProvider);

  // The card always shows the per-check bullet list — green for matches,
  // red for mismatches with the broker's `detail` string. The reassuring
  // user-facing copy + recovery CTAs live on the main swap card
  // (VerificationFailedCard); this side panel is the technical receipt.
  return (
    <section
      className={
        allPassed
          ? "rounded-xl border border-green/30 bg-bg/40 p-4 backdrop-blur-md"
          : "rounded-xl border border-[#FF6B6B]/40 bg-bg/40 p-4 backdrop-blur-md"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink">
          Verification
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-bg/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
          {headerLogo ? (
            <Image
              src={headerLogo}
              alt=""
              width={14}
              height={14}
              className="h-[14px] w-[14px] rounded-full bg-ink/[0.04]"
              unoptimized
            />
          ) : (
            <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-ink/15 text-[8px] font-bold text-ink">
              {headerLabel.charAt(0)}
            </span>
          )}
          {headerLabel}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={
            allPassed
              ? "flex h-4 w-4 items-center justify-center rounded-full bg-green/20 text-green"
              : "flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B6B]/20 text-[#FF6B6B]"
          }
        >
          {allPassed ? <Check className="h-3 w-3" /> : <span className="text-[10px]">✗</span>}
        </span>
        <span
          className={
            allPassed ? "text-[13px] font-medium text-ink" : "text-[13px] font-medium text-[#FF6B6B]"
          }
        >
          {allPassed ? "Verified" : "Verification failed"}
          <span className="ml-1.5 font-mono text-[11px] text-ink-mid">
            · {passed} / {total} checks
          </span>
        </span>
      </div>

      {verification.checks.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          {verification.checks.map((check) => (
            <li key={check.name} className="flex items-start gap-2.5">
              <span
                className={
                  check.passed
                    ? "mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-green"
                    : "mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#FF6B6B]"
                }
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p
                  className={
                    check.passed
                      ? "text-[12.5px] font-medium text-ink"
                      : "text-[12.5px] font-medium text-[#FF6B6B]"
                  }
                >
                  {check.name}{" "}
                  <span className="font-mono text-[10.5px] text-ink-mid">
                    {check.passed ? "— match" : "— mismatch"}
                  </span>
                </p>
                {check.detail && (
                  <p className="mt-0.5 truncate font-mono text-[10.5px] text-ink-mid">
                    {check.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:text-accent-soft"
        >
          View on-chain proof <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </section>
  );
}
