import { describe, expect, it } from "vitest";
import { hasPositiveOutput, smallestQuoteMinimum } from "@/components/swap/swap-panel/quote-gating";
import type { Quote } from "@/components/web-components/types";

function buildQuote(overrides: Partial<Quote>): Quote {
  return {
    provider: "chainflip",
    variantId: "regular",
    variantLabel: "Regular",
    fromCoin: "USDT",
    fromNetwork: "ethereum",
    toCoin: "ETH",
    toNetwork: "ethereum",
    fromAmount: "0.123",
    toAmount: "0",
    rate: 0,
    fees: [],
    estimatedTime: "10-20m",
    source: "live",
    precision: "exact",
    ...overrides,
  };
}

describe("hasPositiveOutput", () => {
  it("rejects zero-output quotes", () => {
    expect(hasPositiveOutput(buildQuote({ toAmount: "0" }))).toBe(false);
  });

  it("rejects unparseable outputs", () => {
    expect(hasPositiveOutput(buildQuote({ toAmount: "" }))).toBe(false);
  });

  it("accepts positive outputs", () => {
    expect(hasPositiveOutput(buildQuote({ toAmount: "0.301" }))).toBe(true);
  });
});

describe("smallestQuoteMinimum", () => {
  it("returns null when no quote carries a minimum", () => {
    expect(smallestQuoteMinimum([buildQuote({})])).toBe(null);
  });

  it("returns the smallest positive minimum across quotes", () => {
    const quotes = [
      buildQuote({ minAmount: "25" }),
      buildQuote({ provider: "near_intents", minAmount: "10" }),
    ];

    expect(smallestQuoteMinimum(quotes)).toBe("10");
  });

  it("ignores zero and unparseable minimums", () => {
    const quotes = [
      buildQuote({ minAmount: "0" }),
      buildQuote({ provider: "near_intents", minAmount: "12" }),
    ];

    expect(smallestQuoteMinimum(quotes)).toBe("12");
  });
});
