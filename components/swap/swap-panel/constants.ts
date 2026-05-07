import type {
  Headline,
  ProtocolOption,
  ProviderInfo,
  ProviderRating,
  RouteTag,
  SortOption,
  TagStyle,
} from "./types";

export const DEFAULT_SLIPPAGE = 1;

export const SLIPPAGE_PRESETS: readonly number[] = [0.5, 1, 1.5, 3];

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: "default", label: "Default" },
  { id: "best", label: "Best Price" },
  { id: "fastest", label: "Fastest" },
];

export const PROTOCOL_OPTIONS: readonly ProtocolOption[] = [
  { id: "all", label: "All Protocols" },
  { id: "thorchain", label: "THORChain" },
  { id: "chainflip", label: "Chainflip" },
  { id: "near_intents", label: "NEAR Intents" },
  { id: "atomicswap", label: "Atomic Swap" },
];

export const HEADLINES: readonly Headline[] = [
  { label: "Decentralized", dot: "bg-accent" },
  { label: "Non custodial", dot: "bg-green" },
  { label: "Best rates", dot: "bg-[#7BB6F2]" },
  { label: "No wallet connect", dot: "bg-[#E8C25A]" },
];

export const PROVIDER_RATINGS: readonly ProviderRating[] = [
  {
    grade: "S",
    provider: "Atomic Swaps",
    body: "Peer-to-peer cryptographic swap, mediated by no one. 100% non-custodial. No KYC, no AML.",
  },
  {
    grade: "A+",
    provider: "THORChain",
    body: "Decentralized cross-chain network. 100% non-custodial. No KYC, no AML.",
  },
  {
    grade: "A",
    provider: "Chainflip",
    body: "Decentralized network with broker-level screening. May reject deposits — never holds custody.",
  },
  {
    grade: "A-",
    provider: "NEAR Intents",
    body: "Routed through bridges with their own AML rules. Can reject and refund pre-quote.",
  },
];

// `NEXT_PUBLIC_BASE_PATH` is "/swap" in this app — it mirrors `basePath` so
// that asset URLs resolve under nginx (where the SPA lives at /swap/...).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const PROVIDER_DISPLAY: Readonly<Record<string, ProviderInfo>> = {
  chainflip: { label: "Chainflip", color: "bg-[#46DAA0]", logo: `${BASE}/coin-icons/Chainflip.png` },
  thorchain: { label: "THORChain", color: "bg-[#23DBA8]", logo: `${BASE}/coin-icons/THORChain.svg` },
  near_intents: { label: "NEAR Intents", color: "bg-[#7B7BFA]", logo: `${BASE}/coin-icons/near-coin.svg` },
  atomicswap: { label: "Atomic Swap", color: "bg-[#F2A55C]" },
};

export const TAG_STYLES: Readonly<Record<RouteTag, TagStyle>> = {
  best: {
    label: "Best price",
    cls: "border-green/50 bg-green/15 text-green",
  },
  fastest: {
    label: "Fastest",
    cls: "border-[#E8C25A]/50 bg-[#E8C25A]/12 text-[#E8C25A]",
  },
};

export const QUOTE_REFRESH_SECONDS = 30;

export const TAG_PRIORITY: readonly RouteTag[] = ["best", "fastest"];
