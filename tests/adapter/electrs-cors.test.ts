import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  broadcastRawTx,
  fetchAddressUtxos,
  fetchFeeRecommended,
  createElectrsBlockchainQuerier,
  createElectrsBlockchainProvider,
} from "@/lib/miradex-web/electrs-cors";
import { electrsBaseUrl } from "@/lib/miradex-web/config";

interface MockResponse {
  readonly ok: boolean;
  readonly status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}

function ok(value: unknown): MockResponse {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(value),
    text: () => Promise.resolve(typeof value === "string" ? value : JSON.stringify(value)),
  };
}

function notFound(): MockResponse {
  return { ok: false, status: 404, text: () => Promise.resolve("not found") };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("electrsBaseUrl", () => {
  it("returns mainnet base for mainnet", () => {
    expect(electrsBaseUrl("mainnet")).toBe("https://mempool.space/api");
  });

  it("returns testnet base for testnet", () => {
    expect(electrsBaseUrl("testnet")).toBe("https://mempool.space/testnet/api");
  });

  it("throws for regtest", () => {
    expect(() => electrsBaseUrl("regtest")).toThrow();
  });
});

describe("fetchAddressUtxos", () => {
  it("returns null when no UTXOs", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok("100"));
    const result = await fetchAddressUtxos("bc1qtest", "mainnet");
    expect(result).toBeNull();
  });

  it("aggregates multiple UTXOs and detects confirmed status", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        ok([
          { txid: "tx1", vout: 0, value: 1000, status: { confirmed: true, block_height: 100 } },
          { txid: "tx1", vout: 1, value: 500, status: { confirmed: true, block_height: 100 } },
        ]),
      )
      .mockResolvedValueOnce(ok("105"));
    const result = await fetchAddressUtxos("bc1qtest", "mainnet");
    expect(result).not.toBeNull();
    expect(result?.value).toBe(1500);
    expect(result?.status).toBe("confirmed");
    expect(result?.confirmations).toBe(6);
    expect(result?.utxos?.length).toBe(2);
  });

  it("reports mempool status for unconfirmed", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(ok([{ txid: "tx2", vout: 0, value: 200, status: { confirmed: false } }]))
      .mockResolvedValueOnce(ok("200"));
    const result = await fetchAddressUtxos("bc1qtest", "mainnet");
    expect(result?.status).toBe("mempool");
    expect(result?.confirmations).toBe(0);
  });
});

describe("fetchFeeRecommended", () => {
  it("reads electrs /fee-estimates and returns the 1-block target as feeRate", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    // Electrs-standard shape: { "<block_target>": <sat/vB> }
    fetchMock.mockResolvedValueOnce(
      ok({ "1": 20, "2": 18, "6": 12, "144": 5 }),
    );
    const fee = await fetchFeeRecommended("mainnet");
    expect(fee.feeRate).toBe(20);
    expect(fee.feeSats).toBe(20 * 130);
  });

  it("falls back to default when /fee-estimates is empty (regtest)", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(ok({}));
    const fee = await fetchFeeRecommended("mainnet");
    expect(fee.feeRate).toBe(10); // FALLBACK_FEE_RATE_SAT_VB
    expect(fee.feeSats).toBe(10 * 130);
  });
});

describe("broadcastRawTx", () => {
  it("POSTs hex and returns txid", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(ok("abc123"));
    const txid = await broadcastRawTx("0200deadbeef", "mainnet");
    expect(txid).toBe("abc123");
    const callArg = fetchMock.mock.calls[0];
    expect(callArg?.[0]).toBe("https://mempool.space/api/tx");
    expect(callArg?.[1]).toMatchObject({ method: "POST", body: "0200deadbeef" });
  });
});

describe("BlockchainQuerier", () => {
  it("returns null for missing raw transaction", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(notFound());
    const querier = createElectrsBlockchainQuerier("mainnet");
    const hex = await querier.getRawTransaction("missing-tx");
    expect(hex).toBeNull();
  });

  it("returns -1 for missing tx height", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(notFound());
    const querier = createElectrsBlockchainQuerier("mainnet");
    const height = await querier.getTransactionHeight("missing-tx");
    expect(height).toBe(-1);
  });
});

describe("BlockchainDataProvider", () => {
  it("estimateFee returns BTC/kB (the SDK's BlockchainDataProvider contract)", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    // electrs /fee-estimates returns sat/vB per block target
    fetchMock.mockResolvedValueOnce(ok({ "1": 15, "6": 8, "144": 3 }));
    const provider = createElectrsBlockchainProvider("mainnet");
    const btcPerKb = await provider.estimateFee(1);
    // 15 sat/vB × 1000 vB/kB / 1e8 sat/BTC = 0.00015 BTC/kB
    expect(btcPerKb).toBeCloseTo(0.00015, 8);
  });
});
