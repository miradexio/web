import type {
  BlockchainDataProvider,
  BlockchainQuerier,
  DetectedDeposit,
  FeeEstimate,
  ScriptHashHistoryEntry,
  TxSummary,
  Utxo,
  UtxoInput,
} from "@miradexio/client";
import type { Network } from "./config";
import { electrsBaseUrls } from "./config";

// Electrs HTTP API: the REST surface that mempool/electrs + Blockstream/electrs
// expose alongside native Electrum. Uses /fee-estimates, /scripthash/...,
// /address/..., /tx/... — works on any CORS-allowed electrs deployment.

interface ElectrsUtxoRaw {
  readonly txid: string;
  readonly vout: number;
  readonly value: number;
  readonly status: {
    readonly confirmed: boolean;
    readonly block_height?: number;
  };
}

interface ElectrsTxStatus {
  readonly confirmed: boolean;
  readonly block_height?: number;
}

interface ElectrsTxIn {
  readonly prevout: { readonly scriptpubkey_address?: string } | null;
}

interface ElectrsTxOut {
  readonly scriptpubkey_address?: string;
}

interface ElectrsTxRaw {
  readonly txid: string;
  readonly status: ElectrsTxStatus;
  readonly vin: ReadonlyArray<ElectrsTxIn>;
  readonly vout: ReadonlyArray<ElectrsTxOut>;
}

const POLL_INTERVAL_MS = 4_000;
// Matches LOCK_TX_VBYTES in the SDK (P2WPKH -> P2WSH lock tx).
const LOCK_TX_VBYTES_ESTIMATE = 130;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, signal !== undefined ? { signal } : undefined);
  if (!res.ok) {
    throw new Error(`electrs ${String(res.status)} on ${url}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function fetchTextOk(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`electrs ${String(res.status)} on ${url}: ${await res.text()}`);
  }
  return res.text();
}

// First non-throwing result; rethrows the last error if every server fails.
// Read-only paths only — broadcast must NOT use this (one-server semantics).
async function tryAcrossServers<T>(
  network: Network,
  attempt: (base: string) => Promise<T>,
): Promise<T> {
  const bases = electrsBaseUrls(network);
  let lastErr: unknown = new Error("no electrs servers configured");
  for (const base of bases) {
    try {
      return await attempt(base);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function fetchChainTip(baseUrl: string, signal?: AbortSignal): Promise<number> {
  const text = await fetchTextOk(`${baseUrl}/blocks/tip/height`, signal !== undefined ? { signal } : undefined);
  const height = Number.parseInt(text.trim(), 10);
  if (!Number.isFinite(height)) {
    throw new Error(`invalid tip height response: ${text}`);
  }
  return height;
}

function utxosToDeposit(
  utxos: readonly ElectrsUtxoRaw[],
  chainHeight: number,
): DetectedDeposit | null {
  if (utxos.length === 0) return null;
  const primary = utxos[0];
  if (primary === undefined) return null;
  const value = utxos.reduce((sum, u) => sum + u.value, 0);
  const inputs: readonly UtxoInput[] = utxos.map((u) => ({
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    height: u.status.confirmed ? u.status.block_height ?? 0 : 0,
  }));
  const primaryConfirmed = primary.status.confirmed;
  const primaryHeight = primary.status.block_height ?? 0;
  const confirmations =
    primaryConfirmed && chainHeight > 0 && primaryHeight > 0
      ? Math.max(0, chainHeight - primaryHeight + 1)
      : 0;
  return {
    txid: primary.txid,
    vout: primary.vout,
    value,
    confirmations,
    status: primaryConfirmed ? "confirmed" : "mempool",
    utxos: inputs,
  };
}

function delayWithSignal(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("aborted", "AbortError"));
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new DOMException("aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function fetchAddressUtxos(
  address: string,
  network: Network,
  signal?: AbortSignal,
): Promise<DetectedDeposit | null> {
  return tryAcrossServers(network, async (base) => {
    const [utxos, tip] = await Promise.all([
      fetchJson<readonly ElectrsUtxoRaw[]>(`${base}/address/${address}/utxo`, signal),
      fetchChainTip(base, signal),
    ]);
    return utxosToDeposit(utxos, tip);
  });
}

export async function watchAddressDeposit(
  address: string,
  network: Network,
  signal: AbortSignal,
  onStatus?: (msg: string) => void,
): Promise<DetectedDeposit> {
  while (!signal.aborted) {
    const detected = await fetchAddressUtxos(address, network, signal);
    if (detected !== null) {
      onStatus?.(detected.status === "confirmed" ? "confirmed" : "mempool");
      return detected;
    }
    onStatus?.("waiting for deposit");
    await delayWithSignal(POLL_INTERVAL_MS, signal);
  }
  throw new DOMException("aborted", "AbortError");
}

// 10 sat/vB confirms in 1-2 blocks on mainnet; regtest accepts any non-zero
// rate. Used when the fee oracle returns no data (regtest, no fee market).
const FALLBACK_FEE_RATE_SAT_VB = 10;

// Electrs /fee-estimates returns { "<block_target>": "<sat/vB>" }; regtest
// returns {} so we fall back.
export async function fetchFeeRecommended(network: Network): Promise<FeeEstimate> {
  try {
    const fees = await tryAcrossServers(network, (base) =>
      fetchJson<Record<string, number>>(`${base}/fee-estimates`),
    );
    // Prefer 1-block target; else the smallest target with a value; else fallback.
    const fastest =
      typeof fees["1"] === "number" && fees["1"] > 0
        ? fees["1"]
        : pickSmallestTargetRate(fees);
    if (fastest === null) {
      return {
        feeRate: FALLBACK_FEE_RATE_SAT_VB,
        feeSats: Math.ceil(FALLBACK_FEE_RATE_SAT_VB * LOCK_TX_VBYTES_ESTIMATE),
      };
    }
    const ceil = Math.max(1, Math.ceil(fastest));
    return {
      feeRate: ceil,
      feeSats: Math.ceil(ceil * LOCK_TX_VBYTES_ESTIMATE),
    };
  } catch {
    return {
      feeRate: FALLBACK_FEE_RATE_SAT_VB,
      feeSats: Math.ceil(FALLBACK_FEE_RATE_SAT_VB * LOCK_TX_VBYTES_ESTIMATE),
    };
  }
}

function pickSmallestTargetRate(fees: Record<string, number>): number | null {
  const entries = Object.entries(fees)
    .map(([k, v]) => [Number(k), v] as const)
    .filter(([k, v]) => Number.isFinite(k) && typeof v === "number" && v > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => a[0] - b[0]);
  return entries[0]?.[1] ?? null;
}

export async function broadcastRawTx(rawHex: string, network: Network): Promise<string> {
  // First accepting server is enough; gossip propagates from any one node.
  return tryAcrossServers(network, (base) =>
    fetchTextOk(`${base}/tx`, { method: "POST", body: rawHex }),
  );
}

function txInputAddresses(tx: ElectrsTxRaw): readonly string[] {
  const addrs: string[] = [];
  for (const v of tx.vin) {
    const a = v.prevout?.scriptpubkey_address;
    if (typeof a === "string") addrs.push(a);
  }
  return addrs;
}

function txOutputAddresses(tx: ElectrsTxRaw): readonly string[] {
  const addrs: string[] = [];
  for (const v of tx.vout) {
    const a = v.scriptpubkey_address;
    if (typeof a === "string") addrs.push(a);
  }
  return addrs;
}

export function createElectrsBlockchainQuerier(network: Network): BlockchainQuerier {
  return {
    async getAddressTransactions(address): Promise<readonly TxSummary[]> {
      const txs = await tryAcrossServers(network, (base) =>
        fetchJson<readonly ElectrsTxRaw[]>(`${base}/address/${address}/txs`),
      );
      return txs.map((tx) => ({
        txid: tx.txid,
        height: tx.status.confirmed ? tx.status.block_height ?? 0 : 0,
        inputAddresses: txInputAddresses(tx),
        outputAddresses: txOutputAddresses(tx),
      }));
    },
    async getRawTransaction(txid): Promise<string | null> {
      return tryAcrossServers(network, async (base) => {
        const res = await fetch(`${base}/tx/${txid}/hex`);
        if (res.status === 404) return null;
        if (!res.ok) {
          throw new Error(`electrs ${String(res.status)} on /tx/${txid}/hex: ${await res.text()}`);
        }
        return res.text();
      });
    },
    async getTransactionHeight(txid): Promise<number> {
      return tryAcrossServers(network, async (base) => {
        const res = await fetch(`${base}/tx/${txid}`);
        if (res.status === 404) return -1;
        if (!res.ok) {
          throw new Error(`electrs ${String(res.status)} on /tx/${txid}: ${await res.text()}`);
        }
        const tx = (await res.json()) as ElectrsTxRaw;
        return tx.status.confirmed ? tx.status.block_height ?? 0 : 0;
      });
    },
  };
}

function utxoFromElectrs(u: ElectrsUtxoRaw): Utxo {
  const confirmed = u.status.confirmed;
  return {
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    confirmations: confirmed ? 1 : 0,
    ...(confirmed && u.status.block_height !== undefined ? { height: u.status.block_height } : {}),
  };
}

// SDK addressToScriptHash returns Electrum-protocol form (sha256 then reversed);
// electrs HTTP API expects the un-reversed (BE) form. Bridge here.
function scriptHashElectrumToElectrs(scriptHashLE: string): string {
  const bytes = scriptHashLE.match(/.{2}/g);
  if (!bytes) return scriptHashLE;
  return bytes.reverse().join("");
}

export function createElectrsBlockchainProvider(network: Network): BlockchainDataProvider {
  return {
    async listUnspent(scriptHash): Promise<readonly Utxo[]> {
      const sh = scriptHashElectrumToElectrs(scriptHash);
      const utxos = await tryAcrossServers(network, (base) =>
        fetchJson<readonly ElectrsUtxoRaw[]>(`${base}/scripthash/${sh}/utxo`),
      );
      return utxos.map(utxoFromElectrs);
    },
    async getTransaction(txid): Promise<string> {
      return tryAcrossServers(network, (base) => fetchTextOk(`${base}/tx/${txid}/hex`));
    },
    async getTransactionHeight(txid): Promise<number> {
      return tryAcrossServers(network, async (base) => {
        const res = await fetch(`${base}/tx/${txid}`);
        if (res.status === 404) return -1;
        if (!res.ok) {
          throw new Error(`electrs ${String(res.status)} on /tx/${txid}: ${await res.text()}`);
        }
        const tx = (await res.json()) as ElectrsTxRaw;
        return tx.status.confirmed ? tx.status.block_height ?? 0 : 0;
      });
    },
    async getHistory(scriptHash): Promise<readonly ScriptHashHistoryEntry[]> {
      const sh = scriptHashElectrumToElectrs(scriptHash);
      const txs = await tryAcrossServers(network, (base) =>
        fetchJson<readonly ElectrsTxRaw[]>(`${base}/scripthash/${sh}/txs`),
      );
      return txs.map((tx) => ({
        tx_hash: tx.txid,
        height: tx.status.confirmed ? tx.status.block_height ?? 0 : 0,
      }));
    },
    async broadcastTransaction(hex): Promise<string> {
      return broadcastRawTx(hex, network);
    },
    async estimateFee(_blocks): Promise<number> {
      // BlockchainDataProvider expects BTC/kB (estimatesmartfee shape).
      // Electrs returns sat/vB. Without the unit fix the SDK would read 10
      // (sat/vB) as 10 BTC/kB and compute a 1.6 BTC fee for a 130-vB lock tx.
      const estimate = await fetchFeeRecommended(network);
      return (estimate.feeRate * 1000) / 1e8;
    },
  };
}
