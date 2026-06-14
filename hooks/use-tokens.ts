"use client";

import { useQuery } from "@tanstack/react-query";
import type { SwapTokenInfo, SwapTokenMap } from "@miradexio/client";
import { useApiClient } from "@/hooks/use-api-client";
import {
  TOKEN_DISPLAY_NAMES,
  TOKEN_ICON_FILES,
} from "../components/web-components/token-icons.generated";
import type { Token } from "../components/web-components/types";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const TOKEN_NAMES: Readonly<Record<string, string>> = {
  BTC: "Bitcoin",
  "BTC-LN": "Bitcoin Lightning",
  "BTC(OMNI)": "Bitcoin Omni",
  ETH: "Ethereum",
  USDT: "Tether",
  USDC: "USD Coin",
  DAI: "Dai",
  WBTC: "Wrapped Bitcoin",
  LINK: "Chainlink",
  UNI: "Uniswap",
  AAVE: "Aave",
  FLIP: "Chainflip",
  LTC: "Litecoin",
  BCH: "Bitcoin Cash",
  SOL: "Solana",
  BNB: "BNB",
  POL: "Polygon",
  ARB: "Arbitrum",
  TRX: "Tron",
  TON: "Toncoin",
  wNEAR: "Wrapped NEAR",
  AVAX: "Avalanche",
  DOGE: "Dogecoin",
  XRP: "XRP",
  OP: "Optimism",
  ATOM: "Cosmos",
  RUNE: "THORChain",
  XMR: "Monero",
  ADA: "Cardano",
  ZEC: "Zcash",
  DASH: "Dash",
  SUI: "Sui",
  APT: "Aptos",
  STRK: "Starknet",
  MON: "Monad",
  BERA: "Berachain",
  OKB: "OKB",
  XPL: "Plasma",
  ALEO: "Aleo",
  ADI: "ADI",
};

function monogramDataUri(symbol: string): string {
  let hash = 0;
  for (const ch of symbol) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  const hue = hash % 360;
  const letters = symbol.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="hsl(${hue},45%,38%)"/><text x="32" y="32" dy="0.36em" text-anchor="middle" font-family="ui-monospace,monospace" font-size="${letters.length > 1 ? 22 : 28}" font-weight="700" fill="#fff">${letters}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function tokenIcon(symbol: string): string {
  const file = TOKEN_ICON_FILES[symbol];
  return file ? `${BASE}/coin-icons/tokens/${file}` : monogramDataUri(symbol);
}

function nameAndIcon(symbol: string): { readonly name: string; readonly icon: string } {
  return {
    name: TOKEN_NAMES[symbol] ?? TOKEN_DISPLAY_NAMES[symbol] ?? symbol,
    icon: tokenIcon(symbol),
  };
}

const FALLBACK_TOKENS: readonly Token[] = [
  {
    coin: "BTC",
    name: "Bitcoin",
    network: "bitcoin",
    icon: tokenIcon("BTC"),
    hasExternalId: false,
    priceUsd: "78000",
    change24hPct: 1.2,
  },
  {
    coin: "XMR",
    name: "Monero",
    network: "monero",
    icon: tokenIcon("XMR"),
    hasExternalId: false,
    priceUsd: "154",
    change24hPct: -0.5,
  },
  {
    coin: "ETH",
    name: "Ethereum",
    network: "ethereum",
    icon: tokenIcon("ETH"),
    hasExternalId: false,
    priceUsd: "2350",
    change24hPct: 0.8,
  },
  {
    coin: "USDT",
    name: "Tether",
    network: "ethereum",
    icon: tokenIcon("USDT"),
    hasExternalId: false,
    priceUsd: "1.00",
    change24hPct: 0.01,
  },
  {
    coin: "USDC",
    name: "USD Coin",
    network: "solana",
    icon: tokenIcon("USDC"),
    hasExternalId: false,
    priceUsd: "1.00",
    change24hPct: 0,
  },
  {
    coin: "SOL",
    name: "Solana",
    network: "solana",
    icon: tokenIcon("SOL"),
    hasExternalId: false,
    priceUsd: "145",
    change24hPct: 4.2,
  },
  {
    coin: "BNB",
    name: "BNB",
    network: "bsc",
    icon: tokenIcon("BNB"),
    hasExternalId: false,
    priceUsd: "580",
    change24hPct: -1.1,
  },
];

function tokenInfoToToken(args: {
  readonly symbol: string;
  readonly chain: string;
  readonly info: SwapTokenInfo;
}): Token {
  const { name, icon } = nameAndIcon(args.symbol);
  return {
    coin: args.symbol,
    name,
    network: args.chain,
    icon,
    hasExternalId: false,
    priceUsd: args.info.priceUsd ?? "0",
    change24hPct: args.info.change24hPct ?? 0,
  };
}

function flattenTokens(map: SwapTokenMap): readonly Token[] {
  const tokens: Token[] = [];
  for (const [chain, entries] of Object.entries(map)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (typeof entry === "string") {
        const { name, icon } = nameAndIcon(entry);
        tokens.push({
          coin: entry,
          name,
          network: chain,
          icon,
          hasExternalId: false,
          priceUsd: "0",
          change24hPct: 0,
        });
      } else if (typeof entry === "object" && entry !== null && "symbol" in entry) {
        const info = entry as SwapTokenInfo;
        tokens.push(tokenInfoToToken({ symbol: info.symbol, chain, info }));
      }
    }
  }
  return tokens;
}

export function useTokens() {
  const apiClient = useApiClient();
  return useQuery<Token[]>({
    queryKey: ["tokens"],
    queryFn: async () => {
      const map = await apiClient.getTokens();
      const tokens = flattenTokens(map);
      return tokens.length > 0 ? [...tokens] : [...FALLBACK_TOKENS];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: [...FALLBACK_TOKENS],
  });
}
