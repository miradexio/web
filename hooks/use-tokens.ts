"use client";

import { useQuery } from "@tanstack/react-query";
import type { SwapTokenInfo, SwapTokenMap } from "@miradexio/client";
import { useApiClient } from "@/hooks/use-api-client";
import type { Token } from "../components/web-components/types";

const TOKEN_METADATA: Record<string, { readonly name: string; readonly icon: string }> = {
  BTC: {
    name: "Bitcoin",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png",
  },
  "BTC-LN": {
    name: "Bitcoin Lightning",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png",
  },
  ETH: {
    name: "Ethereum",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png",
  },
  USDT: {
    name: "Tether",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png",
  },
  USDC: {
    name: "USD Coin",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdc.png",
  },
  DAI: {
    name: "Dai",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/dai.png",
  },
  WBTC: {
    name: "Wrapped Bitcoin",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/wbtc.png",
  },
  LINK: {
    name: "Chainlink",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/link.png",
  },
  UNI: {
    name: "Uniswap",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/uni.png",
  },
  AAVE: {
    name: "Aave",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/aave.png",
  },
  FLIP: {
    name: "Chainflip",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/flip.png",
  },
  LTC: {
    name: "Litecoin",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ltc.png",
  },
  BCH: {
    name: "Bitcoin Cash",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bch.png",
  },
  SOL: {
    name: "Solana",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png",
  },
  BNB: {
    name: "BNB",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bnb.png",
  },
  POL: {
    name: "Polygon",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/matic.png",
  },
  ARB: {
    name: "Arbitrum",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/arb.png",
  },
  TRX: {
    name: "Tron",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/trx.png",
  },
  TON: {
    name: "Toncoin",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ton.png",
  },
  wNEAR: {
    name: "Wrapped NEAR",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/near.png",
  },
  AVAX: {
    name: "Avalanche",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/avax.png",
  },
  DOGE: {
    name: "Dogecoin",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/doge.png",
  },
  XRP: {
    name: "XRP",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png",
  },
  OP: {
    name: "Optimism",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/op.png",
  },
  ATOM: {
    name: "Cosmos",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/atom.png",
  },
  RUNE: {
    name: "THORChain",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/rune.png",
  },
  XMR: {
    name: "Monero",
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xmr.png",
  },
};

function fallbackIcon(symbol: string): string {
  const trimmed = symbol.split("-")[0]?.toLowerCase() ?? "";
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${trimmed}.png`;
}

function nameAndIcon(symbol: string): { readonly name: string; readonly icon: string } {
  return TOKEN_METADATA[symbol] ?? { name: symbol, icon: fallbackIcon(symbol) };
}

const FALLBACK_TOKENS: readonly Token[] = [
  {
    coin: "BTC",
    name: "Bitcoin",
    network: "bitcoin",
    icon: TOKEN_METADATA.BTC.icon,
    hasExternalId: false,
    priceUsd: "78000",
    change24hPct: 1.2,
  },
  {
    coin: "XMR",
    name: "Monero",
    network: "monero",
    icon: TOKEN_METADATA.XMR.icon,
    hasExternalId: false,
    priceUsd: "154",
    change24hPct: -0.5,
  },
  {
    coin: "ETH",
    name: "Ethereum",
    network: "ethereum",
    icon: TOKEN_METADATA.ETH.icon,
    hasExternalId: false,
    priceUsd: "2350",
    change24hPct: 0.8,
  },
  {
    coin: "USDT",
    name: "Tether",
    network: "ethereum",
    icon: TOKEN_METADATA.USDT.icon,
    hasExternalId: false,
    priceUsd: "1.00",
    change24hPct: 0.01,
  },
  {
    coin: "USDC",
    name: "USD Coin",
    network: "solana",
    icon: TOKEN_METADATA.USDC.icon,
    hasExternalId: false,
    priceUsd: "1.00",
    change24hPct: 0,
  },
  {
    coin: "SOL",
    name: "Solana",
    network: "solana",
    icon: TOKEN_METADATA.SOL.icon,
    hasExternalId: false,
    priceUsd: "145",
    change24hPct: 4.2,
  },
  {
    coin: "BNB",
    name: "BNB",
    network: "bsc",
    icon: TOKEN_METADATA.BNB.icon,
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
