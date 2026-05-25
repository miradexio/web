export type ReviewLink = {
  readonly label: string;
  readonly url: string;
};

export const REVIEW_LINKS: readonly ReviewLink[] = [
  { label: "X", url: "https://x.com/MiraDex" },
  { label: "BitcoinTalk", url: "https://bitcointalk.org/index.php?topic=5582517.0" },
  { label: "KYCnot", url: "https://kycnot.me/service/miradex" },
  { label: "Monerica", url: "https://monerica.com/site/miradex" },
  { label: "Trustpilot", url: "https://www.trustpilot.com/review/miradex.io" },
  { label: "Cryptwerk", url: "https://cryptwerk.com/company/miradex/" },
] as const;

const REVIEWABLE_PHASES: ReadonlySet<string> = new Set(["completed", "refunded"]);

export function shouldShowReviewLinks(phase: string): boolean {
  return REVIEWABLE_PHASES.has(phase);
}
