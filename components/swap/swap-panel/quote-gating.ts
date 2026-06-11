import type { Quote } from "../../web-components/types";

export function hasPositiveOutput(quote: Quote): boolean {
  return parseFloat(quote.toAmount) > 0;
}

export function smallestQuoteMinimum(quotes: readonly Quote[]): string | null {
  const minimums = quotes
    .map((quote) => quote.minAmount)
    .filter((min): min is string => typeof min === "string" && parseFloat(min) > 0);
  if (minimums.length === 0) return null;
  return minimums.reduce((smallest, min) =>
    parseFloat(min) < parseFloat(smallest) ? min : smallest,
  );
}
