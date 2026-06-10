import { afterEach, describe, expect, it } from "vitest";
import { openDB } from "idb";
import type { ProtocolParams, SwapKeystore } from "@miradexio/client";
import {
  listKeystoreMetadata,
  listSwapHistory,
  persistKeystore,
  persistProtocolSnapshot,
  persistSwapHistory,
  persistSwapProtocol,
  readKeystore,
  readProtocolSnapshot,
  readSwapHistory,
  readSwapProtocol,
  removeKeystore,
  removeSwapHistory,
  resetDbForTests,
  type SwapHistoryRow,
} from "@/lib/miradex-web/idb";

function buildKeystore(overrides: Partial<SwapKeystore["btc"]> = {}): SwapKeystore {
  return {
    version: 3,
    createdAt: "2026-04-28T00:00:00.000Z",
    warning: "TEST",
    btc: {
      wif: "wif",
      address: "bc1qtest",
      network: "testnet",
      ...overrides,
    },
    keys: {
      s_b: "00".repeat(32),
      v_b: "00".repeat(32),
      S_b_bitcoin: "02" + "00".repeat(32),
      S_b_monero: "00".repeat(32),
      dleq_proof: "00".repeat(64),
      b: "00".repeat(32),
      B: "02" + "00".repeat(32),
      eigenwallet_master_seed: "00".repeat(32),
      libp2p_peer_id: "test-peer",
    },
    swap: {
      receiveAddress: "dest-addr",
      refundAddress: "refund-addr",
    },
  };
}

afterEach(async () => {
  const metas = await listKeystoreMetadata();
  await Promise.all(metas.map((m) => removeKeystore(m.id)));
});

describe("idb keystore round-trip", () => {
  it("persists and reads back a keystore", async () => {
    const keystore = buildKeystore();
    const { id } = await persistKeystore(keystore, "0.5");
    const loaded = await readKeystore(id);
    expect(loaded.btc.address).toBe("bc1qtest");
    expect(loaded.swap.receiveAddress).toBe("dest-addr");
  });

  it("lists keystore metadata", async () => {
    const { id: idA } = await persistKeystore(buildKeystore({ address: "addrA" }), "0.1");
    const { id: idB } = await persistKeystore(buildKeystore({ address: "addrB" }), "0.2");
    const metas = await listKeystoreMetadata();
    const ids = metas.map((m) => m.id).sort();
    expect(ids).toEqual([idA, idB].sort());
    const a = metas.find((m) => m.id === idA);
    expect(a?.btcAddress).toBe("addrA");
    expect(a?.amount).toBe("0.1");
    expect(a?.status).toBe("created");
  });

  it("removes a keystore", async () => {
    const { id } = await persistKeystore(buildKeystore(), "0.3");
    await removeKeystore(id);
    await expect(readKeystore(id)).rejects.toThrow();
  });

  it("throws for missing keystore", async () => {
    await expect(readKeystore("nonexistent")).rejects.toThrow(/not found/);
  });
});

describe("idb protocol storage", () => {
  it("round-trips swap protocol params", async () => {
    const params: ProtocolParams = {
      A: "02" + "00".repeat(32),
      S_a_bitcoin: "02" + "00".repeat(32),
      cancel_timelock: 144,
      punish_timelock: 288,
      redeem_address: "bc1qredeem",
      punish_address: "bc1qpunish",
      tx_cancel_fee_sats: 100,
      tx_refund_fee_sats: 100,
      tx_redeem_fee_sats: 100,
      tx_punish_fee_sats: 100,
    };
    await persistSwapProtocol("swap1", params);
    const loaded = await readSwapProtocol("swap1");
    expect(loaded?.redeem_address).toBe("bc1qredeem");
    expect(loaded?.cancel_timelock).toBe(144);
  });

  it("returns null on missing protocol", async () => {
    const result = await readSwapProtocol("does-not-exist");
    expect(result).toBeNull();
  });

  it("round-trips protocol snapshot json", async () => {
    const json = JSON.stringify({ phase: "presigning" });
    await persistProtocolSnapshot("swap2", json);
    const loaded = await readProtocolSnapshot("swap2");
    expect(loaded).toBe(json);
  });

  it("returns null on missing snapshot", async () => {
    const result = await readProtocolSnapshot("does-not-exist");
    expect(result).toBeNull();
  });
});

describe("idb swap_history (v4)", () => {
  afterEach(async () => {
    const rows = await listSwapHistory();
    await Promise.all(rows.map((r) => removeSwapHistory(r.flowId)));
  });

  it("persists and reads back a row keyed by flowId", async () => {
    const row: SwapHistoryRow = {
      flowId: "MIRA-NEW",
      serverSwapId: "MIRA-NEW",
      createdAt: "2026-04-30T10:00:00.000Z",
      fromCoin: "ETH",
      fromNetwork: "ETH",
      fromAmount: "0.1",
      fromAmountUsd: "350.00",
      toCoin: "BTC",
      toNetwork: "BTC",
      toAmount: "0.01",
      toAmountUsd: "350.00",
      provider: "thorchain",
      status: "creating",
      expiresAt: null,
      depositAddress: null,
      outputTxHash: null,
    };
    await persistSwapHistory(row);
    const loaded = await readSwapHistory("MIRA-NEW");
    expect(loaded).not.toBeNull();
    expect(loaded?.flowId).toBe("MIRA-NEW");
    expect(loaded?.serverSwapId).toBe("MIRA-NEW");
  });

  it("supports atomic-style row with serverSwapId initially null", async () => {
    const ks = "11111111-2222-4333-8444-555555555555";
    const row: SwapHistoryRow = {
      flowId: ks,
      serverSwapId: null,
      createdAt: "2026-04-30T11:00:00.000Z",
      fromCoin: "BTC",
      fromNetwork: "BTC",
      fromAmount: "0.005",
      fromAmountUsd: null,
      toCoin: "XMR",
      toNetwork: "XMR",
      toAmount: "0.5",
      toAmountUsd: null,
      provider: "atomicswap",
      status: "keystore-saved",
      expiresAt: null,
      depositAddress: null,
      outputTxHash: null,
    };
    await persistSwapHistory(row);
    const loaded = await readSwapHistory(ks);
    expect(loaded?.flowId).toBe(ks);
    expect(loaded?.serverSwapId).toBeNull();
  });
});

describe("idb swap_history destAddress (v5)", () => {
  afterEach(async () => {
    const rows = await listSwapHistory();
    await Promise.all(rows.map((r) => removeSwapHistory(r.flowId)));
  });

  it("round-trips destAddress on a new row", async () => {
    const row: SwapHistoryRow = {
      flowId: "MIRA-PROOF1",
      serverSwapId: "MIRA-PROOF1",
      createdAt: "2026-06-09T10:00:00.000Z",
      fromCoin: "BTC",
      fromNetwork: "BTC",
      fromAmount: "0.01",
      fromAmountUsd: null,
      toCoin: "ETH",
      toNetwork: "ETH",
      toAmount: "0.1",
      toAmountUsd: null,
      provider: "thorchain",
      status: "creating",
      expiresAt: null,
      depositAddress: null,
      destAddress: "0xproofdest",
      outputTxHash: null,
    };
    await persistSwapHistory(row);
    const loaded = await readSwapHistory("MIRA-PROOF1");
    expect(loaded?.destAddress).toBe("0xproofdest");
  });

  it("migrates v4 rows (no destAddress key) to destAddress: null", async () => {
    resetDbForTests();
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("miradex-web");
      req.onsuccess = (): void => resolve();
      req.onerror = (): void => resolve();
      req.onblocked = (): void => resolve();
    });

    const v4 = await openDB("miradex-web", 4, {
      upgrade(db): void {
        if (!db.objectStoreNames.contains("keystores")) db.createObjectStore("keystores");
        if (!db.objectStoreNames.contains("swap_protocols"))
          db.createObjectStore("swap_protocols");
        if (!db.objectStoreNames.contains("protocol_snapshots"))
          db.createObjectStore("protocol_snapshots");
        if (!db.objectStoreNames.contains("swap_history"))
          db.createObjectStore("swap_history");
      },
    });
    await v4.put(
      "swap_history",
      {
        flowId: "MIRA-V4ROW",
        serverSwapId: "MIRA-V4ROW",
        createdAt: "2026-05-01T10:00:00.000Z",
        fromCoin: "BTC",
        fromNetwork: "BTC",
        fromAmount: "0.01",
        fromAmountUsd: null,
        toCoin: "ETH",
        toNetwork: "ETH",
        toAmount: "0.1",
        toAmountUsd: null,
        provider: "thorchain",
        status: "completed",
        expiresAt: null,
        depositAddress: "bc1qxxx",
        outputTxHash: null,
      },
      "MIRA-V4ROW",
    );
    v4.close();

    const migrated = await readSwapHistory("MIRA-V4ROW");
    expect(migrated).not.toBeNull();
    expect(migrated?.destAddress).toBeNull();
    expect(migrated?.depositAddress).toBe("bc1qxxx");
  });
});

describe("idb v3 → v4 swap_history migration", () => {
  it("rewrites legacy swapId rows to flowId + serverSwapId", async () => {
    // Tear down any module-cached v4 connection so we can drive v3 first.
    resetDbForTests();

    // Wipe persisted DB state from previous tests.
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("miradex-web");
      req.onsuccess = (): void => resolve();
      req.onerror = (): void => resolve();
      req.onblocked = (): void => resolve();
    });

    // Seed a legacy v3 row.
    const v3 = await openDB("miradex-web", 3, {
      upgrade(db): void {
        if (!db.objectStoreNames.contains("keystores")) db.createObjectStore("keystores");
        if (!db.objectStoreNames.contains("swap_protocols"))
          db.createObjectStore("swap_protocols");
        if (!db.objectStoreNames.contains("protocol_snapshots"))
          db.createObjectStore("protocol_snapshots");
        if (!db.objectStoreNames.contains("swap_history"))
          db.createObjectStore("swap_history");
      },
    });
    await v3.put(
      "swap_history",
      {
        swapId: "MIRA-LEGACY",
        createdAt: "2026-04-29T10:00:00.000Z",
        fromCoin: "BTC",
        fromNetwork: "BTC",
        fromAmount: "0.01",
        fromAmountUsd: "350.00",
        toCoin: "ETH",
        toNetwork: "ETH",
        toAmount: "0.1",
        toAmountUsd: "350.00",
        provider: "thorchain",
        status: "awaiting_deposit",
        expiresAt: null,
        depositAddress: "bc1qxxx",
        outputTxHash: null,
      },
      "MIRA-LEGACY",
    );
    v3.close();

    // Reopen via the production module — this triggers the v4 upgrade
    // callback which migrates the legacy row.
    const migrated = await readSwapHistory("MIRA-LEGACY");
    expect(migrated).not.toBeNull();
    expect(migrated?.flowId).toBe("MIRA-LEGACY");
    expect(migrated?.serverSwapId).toBe("MIRA-LEGACY");
    // The legacy `swapId` field is gone.
    expect((migrated as unknown as { swapId?: unknown }).swapId).toBeUndefined();
  });
});
