import { describe, expect, it } from "vitest";
import {
  REVIEW_LINKS,
  shouldShowReviewLinks,
} from "@/components/swap/swap-client/review-links";

describe("REVIEW_LINKS", () => {
  it("targets the canonical Miradex page on each platform", () => {
    expect(REVIEW_LINKS).toEqual([
      { label: "X", url: "https://x.com/MiraDex" },
      { label: "BitcoinTalk", url: "https://bitcointalk.org/index.php?topic=5582517.0" },
      { label: "KYCnot", url: "https://kycnot.me/service/miradex" },
      { label: "Monerica", url: "https://monerica.com/site/miradex" },
      { label: "Trustpilot", url: "https://www.trustpilot.com/review/miradex.io" },
      { label: "Cryptwerk", url: "https://cryptwerk.com/company/miradex/" },
    ]);
  });

  it("uses https for every URL", () => {
    for (const link of REVIEW_LINKS) {
      expect(link.url).toMatch(/^https:\/\//);
    }
  });

  it("contains no duplicate URLs", () => {
    const urls = REVIEW_LINKS.map((link) => link.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("contains no duplicate labels", () => {
    const labels = REVIEW_LINKS.map((link) => link.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("shouldShowReviewLinks", () => {
  it.each([
    ["completed", true],
    ["refunded", true],
    ["failed", false],
    ["expired", false],
    ["cancelled", false],
    ["punished", false],
    ["processing", false],
    ["verifying", false],
    ["waiting", false],
    ["idle", false],
    ["", false],
  ] as const)("phase=%s -> %s", (phase, expected) => {
    expect(shouldShowReviewLinks(phase)).toBe(expected);
  });
});
