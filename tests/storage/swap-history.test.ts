import { describe, expect, it } from "vitest";
import type { EngineState } from "@miradexio/client";
import {
  buildAtomicHistoryRow,
  buildCreatedSwapHistoryRow,
  extractSnapshot,
  snapshotsEqual,
  type SwapHistoryRow,
} from "@/lib/storage/swap-history";

type FlowSnapshot = NonNullable<EngineState["swap"]["snapshot"]>;

function buildSnapshot(overrides: Partial<FlowSnapshot> = {}): FlowSnapshot {
  return {
    restricted: false,
    depositAddr: "bc1qdeposit",
    destAddress: "0xdest",
    refundAddress: "bc1qrefund",
    keystoreId: null,
    depositAmount: "0.01",
    fromToken: "BTC",
    toToken: "ETH",
    expectedOut: "0.1",
    amountInUsd: "350.00",
    expectedOutUsd: "350.00",
    qr: null,
    verification: null,
    verificationSourceUrl: null,
    expiresAt: "2026-06-09T12:00:00.000Z",
    depositMemo: null,
    provider: "thorchain",
    swapId: "MIRA-SYNC001",
    swapNumber: "MIRA-SYNC001",
    extra: null,
    ...overrides,
  };
}

function buildEngineState(overrides: {
  readonly activeFlow?: EngineState["activeFlow"];
  readonly swapPhase?: string;
  readonly swapSnapshot?: FlowSnapshot | null;
  readonly atomicPhase?: string;
  readonly atomicSnapshot?: FlowSnapshot | null;
}): EngineState {
  return {
    activeFlow: overrides.activeFlow ?? "swap",
    swap: {
      phase: (overrides.swapPhase ?? "swapping") as EngineState["swap"]["phase"],
      snapshot: overrides.swapSnapshot === undefined ? buildSnapshot() : overrides.swapSnapshot,
    },
    atomic: {
      phase: (overrides.atomicPhase ?? "idle") as EngineState["atomic"]["phase"],
      snapshot: overrides.atomicSnapshot === undefined ? null : overrides.atomicSnapshot,
    },
  } as EngineState;
}

function buildRow(overrides: Partial<SwapHistoryRow> = {}): SwapHistoryRow {
  return {
    flowId: "MIRA-SYNC001",
    serverSwapId: "MIRA-SYNC001",
    createdAt: "2026-06-09T10:00:00.000Z",
    fromCoin: "BTC",
    fromNetwork: "BTC",
    fromAmount: "0.01",
    fromAmountUsd: "350.00",
    toCoin: "ETH",
    toNetwork: "ETH",
    toAmount: "0.1",
    toAmountUsd: "350.00",
    provider: "thorchain",
    status: "swapping",
    expiresAt: "2026-06-09T12:00:00.000Z",
    depositAddress: "bc1qdeposit",
    destAddress: "0xdest",
    outputTxHash: null,
    ...overrides,
  };
}

describe("extractSnapshot", () => {
  it("surfaces destAddress from the active flow snapshot", () => {
    const state = buildEngineState({});
    const snap = extractSnapshot(state);
    expect(snap.destAddress).toBe("0xdest");
    expect(snap.depositAddress).toBe("bc1qdeposit");
    expect(snap.serverSwapId).toBe("MIRA-SYNC001");
  });

  it("returns null destAddress when the snapshot has none", () => {
    const state = buildEngineState({
      swapSnapshot: buildSnapshot({ destAddress: null }),
    });
    expect(extractSnapshot(state).destAddress).toBeNull();
  });
});

describe("snapshotsEqual", () => {
  it("is false when destAddress newly arrives", () => {
    const prev = buildRow({ destAddress: null });
    const next = extractSnapshot(buildEngineState({}));
    expect(snapshotsEqual(prev, next)).toBe(false);
  });

  it("treats destAddress as monotonic — a null next never clears a stored value", () => {
    const prev = buildRow({ destAddress: "0xdest" });
    const next = extractSnapshot(
      buildEngineState({ swapSnapshot: buildSnapshot({ destAddress: null }) }),
    );
    expect(snapshotsEqual(prev, next)).toBe(true);
  });

  it("stays equal when nothing changed", () => {
    const prev = buildRow();
    const next = extractSnapshot(buildEngineState({}));
    expect(snapshotsEqual(prev, next)).toBe(true);
  });
});

describe("buildAtomicHistoryRow", () => {
  it("includes destAddress from the atomic snapshot", () => {
    const atomicSnapshot = buildSnapshot({
      destAddress: "4XMRDEST",
      swapId: "MIRA-ATOM001",
      swapNumber: "MIRA-ATOM001",
    });
    const state = buildEngineState({
      activeFlow: "atomic",
      atomicPhase: "swapping",
      atomicSnapshot,
      swapSnapshot: null,
      swapPhase: "idle",
    });
    const next = extractSnapshot(state);
    const row = buildAtomicHistoryRow("flow-1", state, next);
    expect(row).not.toBeNull();
    expect(row?.destAddress).toBe("4XMRDEST");
    expect(row?.serverSwapId).toBe("MIRA-ATOM001");
  });
});

describe("buildCreatedSwapHistoryRow", () => {
  it("stores the destination address as the ownership proof at creation time", () => {
    const row = buildCreatedSwapHistoryRow({
      flowId: "MIRA-NEW001",
      fromCoin: "BTC",
      fromNetwork: "BTC",
      fromAmount: "0.01",
      fromAmountUsd: "350.00",
      toCoin: "ETH",
      toNetwork: "ETH",
      toAmount: "0.1",
      toAmountUsd: "350.00",
      provider: "thorchain",
      destAddress: "0xproof",
    });
    expect(row.destAddress).toBe("0xproof");
    expect(row.flowId).toBe("MIRA-NEW001");
    expect(row.serverSwapId).toBe("MIRA-NEW001");
    expect(row.status).toBe("creating");
    expect(row.depositAddress).toBeNull();
  });
});
