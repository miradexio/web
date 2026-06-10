import { describe, expect, it } from "vitest";
import type { EngineState } from "@miradexio/client";
import { presentedPhase, viewFromState } from "@/components/swap/swap-client/view";

type FlowSnapshot = NonNullable<EngineState["swap"]["snapshot"]>;

function buildSnapshot(overrides: Partial<FlowSnapshot> = {}): FlowSnapshot {
  return {
    restricted: false,
    depositAddr: null,
    destAddress: null,
    refundAddress: null,
    keystoreId: null,
    depositAmount: "0.01",
    fromToken: "BTC",
    toToken: "ETH",
    expectedOut: "0.1",
    amountInUsd: null,
    expectedOutUsd: null,
    qr: null,
    verification: null,
    verificationSourceUrl: null,
    expiresAt: null,
    depositMemo: null,
    provider: "thorchain",
    swapId: "MIRA-VIEW0001",
    swapNumber: "MIRA-VIEW0001",
    extra: null,
    ...overrides,
  };
}

function buildState(snapshot: FlowSnapshot): EngineState {
  return {
    activeFlow: "swap",
    swap: { phase: "swapping", snapshot, requiredAction: null },
    atomic: { phase: "idle", snapshot: null },
  } as EngineState;
}

describe("viewFromState — restricted flag", () => {
  it("surfaces restricted: true from the snapshot", () => {
    const view = viewFromState(buildState(buildSnapshot({ restricted: true })));
    expect(view?.restricted).toBe(true);
  });

  it("defaults restricted to false", () => {
    const view = viewFromState(buildState(buildSnapshot()));
    expect(view?.restricted).toBe(false);
  });
});

describe("presentedPhase", () => {
  function viewWith(restricted: boolean, phase: string) {
    const view = viewFromState(buildState(buildSnapshot({ restricted })));
    if (view === null) throw new Error("view must not be null");
    return { ...view, phase };
  }

  it("presents restricted creating-swap as awaiting-deposit", () => {
    expect(presentedPhase(viewWith(true, "creating-swap"))).toBe("awaiting-deposit");
  });

  it("keeps creating-swap for owner (non-restricted) views", () => {
    expect(presentedPhase(viewWith(false, "creating-swap"))).toBe("creating-swap");
  });

  it("passes through other restricted phases untouched", () => {
    expect(presentedPhase(viewWith(true, "swapping"))).toBe("swapping");
    expect(presentedPhase(viewWith(true, "completed"))).toBe("completed");
  });
});
