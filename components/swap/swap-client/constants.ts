import type { RequiredAction } from "@miradexio/client";

export const TERMINAL_PHASES: ReadonlySet<string> = new Set([
  "completed",
  "failed",
  "refunded",
  "expired",
  "cancelled",
  "punished",
]);

export const SUCCESS_PHASES: ReadonlySet<string> = new Set(["completed"]);
export const WARN_PHASES: ReadonlySet<string> = new Set(["refunded", "expired", "cancelled"]);
export const FAIL_PHASES: ReadonlySet<string> = new Set(["failed", "punished"]);
export const CANCEL_FLOW_PHASES: ReadonlySet<string> = new Set([
  "cancelling",
  "verifying-cancel",
  "refunding",
]);
export const USER_ACTIONABLE: ReadonlySet<RequiredAction["type"]> = new Set([
  "cancel",
  "refund",
  "sweep",
]);

export const PROVIDER_LABELS: Readonly<Record<string, string>> = {
  chainflip: "Chainflip",
  thorchain: "THORChain",
  near_intents: "NEAR Intents",
  atomicswap: "Atomic Swap",
};

// `NEXT_PUBLIC_BASE_PATH` is "/swap" in this app — it mirrors `basePath` so
// that asset URLs resolve under nginx (where the SPA lives at /swap/...).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const PROVIDER_LOGOS: Readonly<Record<string, string>> = {
  chainflip: `${BASE}/coin-icons/Chainflip.png`,
  thorchain: `${BASE}/coin-icons/THORChain.svg`,
  near_intents: `${BASE}/coin-icons/near-coin.svg`,
};

export const URI_SCHEMES: Readonly<Record<string, { readonly scheme: string; readonly param: string }>> = {
  BTC: { scheme: "bitcoin", param: "amount" },
  XMR: { scheme: "monero", param: "tx_amount" },
  LTC: { scheme: "litecoin", param: "amount" },
  DOGE: { scheme: "dogecoin", param: "amount" },
  BCH: { scheme: "bitcoincash", param: "amount" },
};

export const TOKEN_ICON_BASE_URL =
  "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color";
