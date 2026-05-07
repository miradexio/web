import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  KeystoreMetadata,
  KeystoreStatus,
  ProtocolParams,
  SwapKeystore,
} from "@miradexio/client";
import { consoleLogger } from "./logger";

interface KeystoreRow {
  readonly keystore: SwapKeystore;
  readonly label: string;
  readonly status: KeystoreStatus;
  readonly depositTxid: string | null;
  readonly depositValue: number | null;
  readonly swapId: string | null;
  readonly createdAt: string;
}

export interface SwapHistoryRow {
  readonly flowId: string;
  readonly serverSwapId: string | null;
  readonly createdAt: string;
  readonly fromCoin: string;
  readonly fromNetwork: string;
  readonly fromAmount: string;
  readonly fromAmountUsd: string | null;
  readonly toCoin: string;
  readonly toNetwork: string;
  readonly toAmount: string;
  readonly toAmountUsd: string | null;
  readonly provider: string;
  readonly status: string;
  readonly expiresAt: string | null;
  readonly depositAddress: string | null;
  readonly outputTxHash: string | null;
}

interface MiradexSchema extends DBSchema {
  keystores: { key: string; value: KeystoreRow };
  swap_protocols: { key: string; value: ProtocolParams };
  protocol_snapshots: { key: string; value: string };
  swap_history: { key: string; value: SwapHistoryRow };
}

const DB_NAME = "miradex-web";
// Bump when adding/changing object stores OR migrating row shapes. The
// `upgrade` callback below is additive — it creates missing stores
// unconditionally and runs version-gated row rewrites guarded by `oldVersion`.
// v4: rename `swapId` → `flowId` on swap_history rows and seed `serverSwapId`.
const DB_VERSION = 4;
const STORE_KEYSTORES = "keystores";
const STORE_SWAP_PROTOCOLS = "swap_protocols";
const STORE_PROTOCOL_SNAPSHOTS = "protocol_snapshots";
const STORE_SWAP_HISTORY = "swap_history";

let dbPromise: Promise<IDBPDatabase<MiradexSchema>> | null = null;

interface LegacySwapHistoryRow {
  readonly swapId: string;
  readonly createdAt: string;
  readonly fromCoin: string;
  readonly fromNetwork: string;
  readonly fromAmount: string;
  readonly fromAmountUsd: string | null;
  readonly toCoin: string;
  readonly toNetwork: string;
  readonly toAmount: string;
  readonly toAmountUsd: string | null;
  readonly provider: string;
  readonly status: string;
  readonly expiresAt: string | null;
  readonly depositAddress: string | null;
  readonly outputTxHash: string | null;
}

export function isLegacySwapHistoryRow(
  value: unknown,
): value is LegacySwapHistoryRow {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.swapId === "string" && typeof v.flowId !== "string";
}

export function legacyRowToFlowRow(value: LegacySwapHistoryRow): SwapHistoryRow {
  return {
    flowId: value.swapId,
    serverSwapId: value.swapId,
    createdAt: value.createdAt,
    fromCoin: value.fromCoin,
    fromNetwork: value.fromNetwork,
    fromAmount: value.fromAmount,
    fromAmountUsd: value.fromAmountUsd,
    toCoin: value.toCoin,
    toNetwork: value.toNetwork,
    toAmount: value.toAmount,
    toAmountUsd: value.toAmountUsd,
    provider: value.provider,
    status: value.status,
    expiresAt: value.expiresAt,
    depositAddress: value.depositAddress,
    outputTxHash: value.outputTxHash,
  };
}

function hasAllStores(db: IDBPDatabase<MiradexSchema>): boolean {
  const names = db.objectStoreNames;
  return (
    names.contains(STORE_KEYSTORES) &&
    names.contains(STORE_SWAP_PROTOCOLS) &&
    names.contains(STORE_PROTOCOL_SNAPSHOTS) &&
    names.contains(STORE_SWAP_HISTORY)
  );
}

function openMiradexDb(): Promise<IDBPDatabase<MiradexSchema>> {
  return openDB<MiradexSchema>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, _newVersion, tx): void {
      if (!database.objectStoreNames.contains(STORE_KEYSTORES)) {
        database.createObjectStore(STORE_KEYSTORES);
      }
      if (!database.objectStoreNames.contains(STORE_SWAP_PROTOCOLS)) {
        database.createObjectStore(STORE_SWAP_PROTOCOLS);
      }
      if (!database.objectStoreNames.contains(STORE_PROTOCOL_SNAPSHOTS)) {
        database.createObjectStore(STORE_PROTOCOL_SNAPSHOTS);
      }
      if (!database.objectStoreNames.contains(STORE_SWAP_HISTORY)) {
        database.createObjectStore(STORE_SWAP_HISTORY);
      }

      if (oldVersion < 4) {
        // v4: rename swapId → flowId on swap_history rows and seed
        // serverSwapId. Pre-v4 rows are all non-atomic (atomic flows
        // couldn't be created before the flowId refactor due to the
        // startup deadlock), so serverSwapId === flowId for legacy rows.
        const store = tx.objectStore(STORE_SWAP_HISTORY);
        void (async (): Promise<void> => {
          let cursor = await store.openCursor();
          while (cursor !== null) {
            const value: unknown = cursor.value;
            if (isLegacySwapHistoryRow(value)) {
              await cursor.update(legacyRowToFlowRow(value));
            }
            cursor = await cursor.continue();
          }
        })();
      }
    },
    blocked(): void {
      // Another tab holds an older version open. The upgrade waits for it to
      // close. Without explicit handling the user just sees a hang.
      consoleLogger.warn({}, "miradex-web IDB upgrade blocked by another tab");
    },
    blocking(): void {
      // We're holding the DB open while another tab tries to upgrade. Release
      // our connection so the other tab can proceed.
      const previous = dbPromise;
      dbPromise = null;
      if (previous !== null) {
        void previous.then((handle) => handle.close()).catch(() => undefined);
      }
    },
  });
}

async function getDb(): Promise<IDBPDatabase<MiradexSchema>> {
  if (dbPromise === null) {
    dbPromise = openMiradexDb();
  }
  const db = await dbPromise;
  // The cached connection may be stale (HMR, prior version, another tab
  // closed the DB). Reopen if any expected store is missing.
  if (hasAllStores(db)) return db;
  db.close();
  dbPromise = openMiradexDb();
  return dbPromise;
}

export function resetDbForTests(): void {
  if (dbPromise !== null) {
    void dbPromise.then((handle) => handle.close()).catch(() => undefined);
    dbPromise = null;
  }
}

function generateId(): string {
  // `crypto.randomUUID` is gated to secure contexts in some browser versions;
  // self-hosted miradex-web on plain HTTP fails with "randomUUID is not a
  // function". Fall back to `crypto.getRandomValues` (which has no such
  // gate) when the shortcut is missing.
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (!c?.getRandomValues) {
    throw new Error("Missing crypto entropy source (getRandomValues)");
  }
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  // RFC 4122 §4.4 — set version (4) and variant (10xx) bits.
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const h = Array.from(b, (n) => n.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function rowToMetadata(id: string, row: KeystoreRow): KeystoreMetadata {
  return {
    id,
    btcAddress: row.keystore.btc.address,
    destAddress: row.keystore.swap.receiveAddress,
    refundAddress: row.keystore.swap.refundAddress,
    amount: row.label,
    network: row.keystore.btc.network,
    status: row.status,
    depositTxid: row.depositTxid,
    depositValue: row.depositValue,
    swapId: row.swapId,
    createdAt: row.createdAt,
  };
}

export async function patchKeystoreSwapId(
  keystoreId: string,
  swapId: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_KEYSTORES, "readwrite");
  const existing = await tx.store.get(keystoreId);
  if (existing === undefined || existing.swapId === swapId) {
    await tx.done;
    return;
  }
  await tx.store.put({ ...existing, swapId }, keystoreId);
  await tx.done;
}

// Restart-after-maker-timeout: the failed server swap is dead but the
// keystore still owns valid keys + (maybe) funded UTXOs. Clearing swapId
// lets resumeAtomicSwap skip Path A and lets a fresh
// startAtomicSwap({ existingKeystoreId }) bind to a new server swap.
// Idempotent.
export async function clearKeystoreSwapId(keystoreId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_KEYSTORES, "readwrite");
  const existing = await tx.store.get(keystoreId);
  if (existing === undefined || existing.swapId === null) {
    await tx.done;
    return;
  }
  await tx.store.put({ ...existing, swapId: null }, keystoreId);
  await tx.done;
}

export async function persistKeystore(
  keystore: SwapKeystore,
  label: string,
): Promise<{ readonly id: string }> {
  const db = await getDb();
  const id = generateId();
  const row: KeystoreRow = {
    keystore,
    label,
    status: "created",
    depositTxid: null,
    depositValue: null,
    swapId: null,
    createdAt: new Date().toISOString(),
  };
  await db.put(STORE_KEYSTORES, row, id);
  return { id };
}

export async function readKeystore(id: string): Promise<SwapKeystore> {
  const db = await getDb();
  const row = await db.get(STORE_KEYSTORES, id);
  if (row === undefined) {
    throw new Error(`keystore not found: ${id}`);
  }
  return row.keystore;
}

export async function listKeystoreMetadata(): Promise<readonly KeystoreMetadata[]> {
  const db = await getDb();
  const tx = db.transaction(STORE_KEYSTORES, "readonly");
  const [keys, values] = await Promise.all([tx.store.getAllKeys(), tx.store.getAll()]);
  await tx.done;
  return keys.flatMap((key, index) => {
    const row = values[index];
    return row === undefined ? [] : [rowToMetadata(String(key), row)];
  });
}

export async function removeKeystore(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_KEYSTORES, id);
}

export async function persistSwapProtocol(
  swapId: string,
  params: ProtocolParams,
): Promise<void> {
  const db = await getDb();
  await db.put(STORE_SWAP_PROTOCOLS, params, swapId);
}

export async function readSwapProtocol(swapId: string): Promise<ProtocolParams | null> {
  const db = await getDb();
  const value = await db.get(STORE_SWAP_PROTOCOLS, swapId);
  return value ?? null;
}

export async function persistProtocolSnapshot(
  swapId: string,
  snapshotJson: string,
): Promise<void> {
  const db = await getDb();
  await db.put(STORE_PROTOCOL_SNAPSHOTS, snapshotJson, swapId);
}

export async function readProtocolSnapshot(swapId: string): Promise<string | null> {
  const db = await getDb();
  const value = await db.get(STORE_PROTOCOL_SNAPSHOTS, swapId);
  return value ?? null;
}

export async function persistSwapHistory(row: SwapHistoryRow): Promise<void> {
  const db = await getDb();
  await db.put(STORE_SWAP_HISTORY, row, row.flowId);
}

export async function patchSwapHistory(
  flowId: string,
  patch: Partial<SwapHistoryRow>,
): Promise<SwapHistoryRow | null> {
  const db = await getDb();
  const tx = db.transaction(STORE_SWAP_HISTORY, "readwrite");
  const existing = await tx.store.get(flowId);
  if (existing === undefined) {
    await tx.done;
    return null;
  }
  const next: SwapHistoryRow = { ...existing, ...patch, flowId };
  await tx.store.put(next, flowId);
  await tx.done;
  return next;
}

export async function readSwapHistory(flowId: string): Promise<SwapHistoryRow | null> {
  const db = await getDb();
  return (await db.get(STORE_SWAP_HISTORY, flowId)) ?? null;
}

export async function listSwapHistory(): Promise<readonly SwapHistoryRow[]> {
  const db = await getDb();
  const rows = await db.getAll(STORE_SWAP_HISTORY);
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function removeSwapHistory(flowId: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_SWAP_HISTORY, flowId);
}
