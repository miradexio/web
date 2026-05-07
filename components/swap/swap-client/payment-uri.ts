import { URI_SCHEMES } from "./constants";

export function buildPaymentUri(
  token: string | null,
  address: string,
  amount: string | null,
): string {
  if (!amount) return address;
  const entry = URI_SCHEMES[(token ?? "").toUpperCase()];
  if (entry) return `${entry.scheme}:${address}?${entry.param}=${amount}`;
  return `${address}?amount=${amount}`;
}
