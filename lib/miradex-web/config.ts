import {
  MAINNET_NODES as SDK_MONERO_MAINNET_NODES,
  STAGENET_NODES as SDK_MONERO_STAGENET_NODES,
} from "@miradexio/client";
import type { EngineConfig } from "@miradexio/client";

export type Network = "mainnet" | "testnet" | "regtest";

const DEFAULT_API_URL = "/api/proxy";
const DEFAULT_NETWORK: Network = "mainnet";
// THORChain swap-create worst case ~15-20s (memo broadcast + reference
// lookup with retries). 60s = headroom without being slow-hang-tolerant.
const DEFAULT_API_TIMEOUT_MS = 60_000;
const DEFAULT_API_MAX_RETRIES = 3;
const DEFAULT_SLIPPAGE_BPS = 300;

function nonEmpty(value: string | undefined): string | undefined {
  return value !== undefined && value.length > 0 ? value : undefined;
}

function parseNetwork(raw: string | undefined): Network {
  if (raw === "testnet" || raw === "regtest") return raw;
  return DEFAULT_NETWORK;
}

function parseNodeList(raw: string | undefined): readonly string[] | undefined {
  if (raw === undefined) return undefined;
  const list = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return list.length > 0 ? list : undefined;
}

function defaultMoneroNodes(network: Network): readonly string[] {
  return network === "mainnet" ? SDK_MONERO_MAINNET_NODES : SDK_MONERO_STAGENET_NODES;
}

export interface ResolvedWebConfig {
  readonly engineConfig: EngineConfig;
  readonly network: Network;
  readonly apiUrl: string;
  readonly monerodNodes: readonly string[];
}

function boundFetch(): typeof globalThis.fetch | undefined {
  if (typeof globalThis === "undefined" || typeof globalThis.fetch !== "function") {
    return undefined;
  }
  return globalThis.fetch.bind(globalThis);
}

export function resolveWebConfig(): ResolvedWebConfig {
  const network = parseNetwork(nonEmpty(process.env.NEXT_PUBLIC_NETWORK));
  const apiUrl = nonEmpty(process.env.NEXT_PUBLIC_API_URL) ?? DEFAULT_API_URL;
  const monerodNodes =
    parseNodeList(nonEmpty(process.env.NEXT_PUBLIC_MONERO_NODES)) ?? defaultMoneroNodes(network);
  const engineConfig: EngineConfig = {
    apiUrl,
    network,
    monerodNodes,
    apiTimeout: DEFAULT_API_TIMEOUT_MS,
    apiMaxRetries: DEFAULT_API_MAX_RETRIES,
    slippageBps: DEFAULT_SLIPPAGE_BPS,
    fetchFn: boundFetch(),
  };
  return { engineConfig, network, apiUrl, monerodNodes };
}

// Probed with `curl -I -H 'Origin: ...'` for `access-control-allow-origin: *`.
// Browser fetch walks them in order with fallback. mempool/electrs and
// Blockstream/electrs share a REST surface so they're interchangeable;
// edit + rebuild to change operators.
export const ELECTRS_CORS_SERVERS: Readonly<
  Record<"mainnet" | "testnet", readonly string[]>
> = {
  mainnet: [
    "https://mempool.space/api",
    "https://blockstream.info/api",
    "https://mempool.emzy.de/api",
    "https://mempool.fra.mempool.space/api",
    "https://mempool.va1.mempool.space/api",
  ],
  testnet: [
    "https://mempool.space/testnet/api",
    "https://blockstream.info/testnet/api",
    "https://mempool.fra.mempool.space/testnet/api",
  ],
};

// Ordered list; callers iterate with fallback. Regtest is a single
// operator-supplied URL (no public CORS-allowed regtest exists).
export function electrsBaseUrls(network: Network): readonly string[] {
  if (network === "regtest") {
    const url = nonEmpty(process.env.NEXT_PUBLIC_REGTEST_BTC_API);
    if (url === undefined) {
      throw new Error(
        "regtest requires NEXT_PUBLIC_REGTEST_BTC_API (e.g. http://localhost:30002) to be set",
      );
    }
    return [url];
  }
  return ELECTRS_CORS_SERVERS[network];
}

// First URL only, for callers that don't need fallback. The cross-server
// retry happens inside electrs-cors.ts.
export function electrsBaseUrl(network: Network): string {
  const [primary] = electrsBaseUrls(network);
  if (primary === undefined) {
    throw new Error(`no electrs servers configured for network=${network}`);
  }
  return primary;
}
