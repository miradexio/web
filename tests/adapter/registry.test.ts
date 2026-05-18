import { describe, expect, it, beforeEach, vi } from "vitest";
import type { MiradexEngine } from "@miradexio/client";
import { EngineRegistry, getRegistry, resetRegistryForTests } from "@/lib/miradex-web/registry";
import { createFakeEngine, makeSnapshot } from "./_helpers/fake-engine";

type FakeHandle = ReturnType<typeof createFakeEngine>;

// Captures whatever the registry's engineFactory builds. The factory is called
// synchronously by the registry, so by the time the test awaits anything from
// the registry the captured handle is guaranteed defined — `get()` just makes
// that contract explicit and keeps tests free of non-null assertions.
function captureFake(): {
  readonly factory: () => MiradexEngine;
  readonly get: () => FakeHandle;
} {
  let fake: FakeHandle | undefined;
  return {
    factory: (): MiradexEngine => {
      fake = createFakeEngine();
      return fake.engine;
    },
    get: (): FakeHandle => {
      if (fake === undefined) throw new Error("captureFake.get(): factory has not run yet");
      return fake;
    },
  };
}

beforeEach(() => {
  resetRegistryForTests();
});

describe("getRegistry", () => {
  it("returns the same instance across calls", () => {
    const a = getRegistry();
    const b = getRegistry();
    expect(a).toBe(b);
  });

  it("constructs an ApiClient", () => {
    const registry = getRegistry();
    expect(registry.apiClient).toBeDefined();
  });
});

describe("EngineRegistry book-keeping", () => {
  it("listFlowIds is empty initially", () => {
    const registry = new EngineRegistry();
    expect(registry.listFlowIds()).toEqual([]);
  });

  it("getStateOf returns null for unknown id", () => {
    const registry = new EngineRegistry();
    expect(registry.getStateOf("missing")).toBeNull();
  });

  it("subscribe returns an unsubscriber", () => {
    const registry = new EngineRegistry();
    let count = 0;
    const unsub = registry.subscribe(() => {
      count++;
    });
    unsub();
    expect(typeof unsub).toBe("function");
    expect(count).toBe(0);
  });

  it("destroy is a no-op for unknown id", () => {
    const registry = new EngineRegistry();
    expect(() => registry.destroy("missing")).not.toThrow();
    expect(registry.listFlowIds()).toEqual([]);
  });
});

describe("EngineRegistry: engine factory injection", () => {
  it("uses the injected factory to build engines", () => {
    let count = 0;
    const factory = (): MiradexEngine => {
      count++;
      return createFakeEngine().engine;
    };
    const registry = new EngineRegistry({ engineFactory: factory });
    // startAtomicSwap synchronously calls createEngine() before its first
    // await. The promise will eventually time out — we just check the
    // factory ran.
    void registry
      .startAtomicSwap({ amount: "0.01", destAddress: "x", refundAddress: "y" })
      .catch(() => undefined);
    expect(count).toBe(1);
  });
});

describe("EngineRegistry: resume id-shape routing", () => {
  it("routes a UUID id to engine.resumeAtomicSwap", async () => {
    const fakes = captureFake();
    const registry = new EngineRegistry({ engineFactory: fakes.factory });
    const ks = "11111111-2222-4333-8444-555555555555";
    await registry.resume(ks);
    const methods = fakes.get().calls.map((c) => c.method);
    expect(methods).toContain("resumeAtomicSwap");
    expect(methods).not.toContain("resume");
  });

  it("routes a server swapId to engine.resume", async () => {
    const fakes = captureFake();
    const registry = new EngineRegistry({ engineFactory: fakes.factory });
    await registry.resume("MIRA-ABC123");
    const methods = fakes.get().calls.map((c) => c.method);
    expect(methods).toContain("resume");
    expect(methods).not.toContain("resumeAtomicSwap");
  });

  it("is idempotent — second resume call with same id reuses the engine", async () => {
    let count = 0;
    const factory = (): MiradexEngine => {
      count++;
      return createFakeEngine().engine;
    };
    const registry = new EngineRegistry({ engineFactory: factory });
    await registry.resume("MIRA-ABC123");
    await registry.resume("MIRA-ABC123");
    expect(count).toBe(1);
  });
});

describe("EngineRegistry: secondary index population", () => {
  it("populates bySwapId when atomic state surfaces serverSwapId", async () => {
    const fakes = captureFake();
    const registry = new EngineRegistry({ engineFactory: fakes.factory });

    const startPromise = registry.startAtomicSwap({
      amount: "0.01",
      destAddress: "x",
      refundAddress: "y",
    });
    // Let the registry attach its waitForFirstKeystoreId listener.
    await Promise.resolve();
    const ks = "11111111-2222-4333-8444-555555555555";
    fakes.get().emitState({
      atomic: {
        phase: "keystore-saved",
        snapshot: makeSnapshot({ keystoreId: ks }),
        message: "keystore saved",
      },
    });
    const { flowId } = await startPromise;
    expect(flowId).toBe(ks);

    // Now the server swapId arrives.
    fakes.get().emitState({
      atomic: {
        phase: "creating-swap",
        snapshot: makeSnapshot({ keystoreId: ks, swapId: "MIRA-ABC123" }),
        message: "creating swap",
      },
    });

    expect(registry.getEngine(ks)).toBe(fakes.get().engine);
    expect(registry.getEngine("MIRA-ABC123")).toBe(fakes.get().engine);
  });
});

describe("EngineRegistry: stalled rebuild on resume", () => {
  it("destroys + rebuilds the engine when resume() is called on a stalled atomic flow", async () => {
    let factoryCalls = 0;
    let lastFake: ReturnType<typeof createFakeEngine> | undefined;
    const factory = () => {
      factoryCalls++;
      lastFake = createFakeEngine();
      return lastFake.engine;
    };
    const registry = new EngineRegistry({ engineFactory: factory });

    const startPromise = registry.startAtomicSwap({
      amount: "0.01",
      destAddress: "x",
      refundAddress: "y",
    });
    await Promise.resolve();
    const ks = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    lastFake!.emitState({
      atomic: {
        phase: "keystore-saved",
        snapshot: makeSnapshot({ keystoreId: ks }),
        message: "ks",
      },
    });
    const { flowId } = await startPromise;
    expect(factoryCalls).toBe(1);

    lastFake!.emitState({
      atomic: {
        phase: "stalled",
        snapshot: makeSnapshot({ keystoreId: ks }),
        error: "network blip",
        swapId: null,
        keystoreId: ks,
      } as never,
    });

    await registry.resume(flowId);

    expect(factoryCalls).toBe(2);
    expect(lastFake!.calls.map((c) => c.method)).toContain("resumeAtomicSwap");
  });

  it("stops rebuilding after the cap (3 attempts) is reached", async () => {
    let factoryCalls = 0;
    let lastFake: ReturnType<typeof createFakeEngine> | undefined;
    const factory = () => {
      factoryCalls++;
      lastFake = createFakeEngine();
      return lastFake.engine;
    };
    const registry = new EngineRegistry({ engineFactory: factory });

    const startPromise = registry.startAtomicSwap({
      amount: "0.01",
      destAddress: "x",
      refundAddress: "y",
    });
    await Promise.resolve();
    const ks = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
    lastFake!.emitState({
      atomic: {
        phase: "keystore-saved",
        snapshot: makeSnapshot({ keystoreId: ks }),
        message: "ks",
      },
    });
    await startPromise;
    expect(factoryCalls).toBe(1);

    const emitStalled = (): void => {
      lastFake!.emitState({
        atomic: {
          phase: "stalled",
          snapshot: makeSnapshot({ keystoreId: ks }),
          error: "blip",
          swapId: null,
          keystoreId: ks,
        } as never,
      });
    };

    emitStalled();
    await registry.resume(ks);
    expect(factoryCalls).toBe(2);

    emitStalled();
    await registry.resume(ks);
    expect(factoryCalls).toBe(3);

    emitStalled();
    await registry.resume(ks);
    expect(factoryCalls).toBe(4);

    emitStalled();
    await registry.resume(ks);
    expect(factoryCalls).toBe(4);
  });
});

describe("EngineRegistry: destroy cleans both indexes", () => {
  it("removes engine + all index entries when destroying an atomic flow", async () => {
    const fakes = captureFake();
    const registry = new EngineRegistry({ engineFactory: fakes.factory });

    const startPromise = registry.startAtomicSwap({
      amount: "0.01",
      destAddress: "x",
      refundAddress: "y",
    });
    await Promise.resolve();
    const ks = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    fakes.get().emitState({
      atomic: {
        phase: "keystore-saved",
        snapshot: makeSnapshot({ keystoreId: ks }),
        message: "ks",
      },
    });
    const { flowId } = await startPromise;

    fakes.get().emitState({
      atomic: {
        phase: "creating-swap",
        snapshot: makeSnapshot({ keystoreId: ks, swapId: "MIRA-DEAD" }),
        message: "creating",
      },
    });

    expect(registry.getEngine("MIRA-DEAD")).not.toBeNull();
    expect(registry.getEngine(ks)).not.toBeNull();

    registry.destroy(flowId);

    expect(registry.getEngine("MIRA-DEAD")).toBeNull();
    expect(registry.getEngine(ks)).toBeNull();
    expect(registry.listFlowIds()).toEqual([]);
    expect(fakes.get().calls.map((c) => c.method)).toContain("destroy");
  });
});

describe("EngineRegistry: start failure paths", () => {
  it("rejects startAtomicSwap if engine emits atomic.phase=failed first", async () => {
    const fakes = captureFake();
    const registry = new EngineRegistry({ engineFactory: fakes.factory });

    const startPromise = registry.startAtomicSwap({
      amount: "0.01",
      destAddress: "x",
      refundAddress: "y",
    });
    await Promise.resolve();
    fakes.get().emitState({
      atomic: {
        phase: "failed",
        snapshot: null,
        error: "saveKeystore failed",
      },
    });

    await expect(startPromise).rejects.toThrow(/saveKeystore failed/);
    expect(registry.listFlowIds()).toEqual([]);
    expect(fakes.get().calls.map((c) => c.method)).toContain("destroy");
  });

  it("rejects startSwap if no swapId arrives within timeout", async () => {
    vi.useFakeTimers();
    try {
      const fakes = captureFake();
      const registry = new EngineRegistry({ engineFactory: fakes.factory });

      const startPromise = registry.startSwap({
        fromToken: "BTC",
        fromChain: "BTC",
        toToken: "ETH",
        toChain: "ETH",
        amount: "0.01",
        destAddress: "x",
        refundAddress: "y",
        selectedQuote: {} as never,
      });
      // Swallow rejection — we assert on it below.
      const settled = startPromise.catch((err: unknown) => err);
      await vi.advanceTimersByTimeAsync(31_000);
      const result = await settled;
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toMatch(/timeout waiting for swap creation/);
      expect(registry.listFlowIds()).toEqual([]);
      expect(fakes.get().calls.map((c) => c.method)).toContain("destroy");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("EngineRegistry: concurrent resume dedup", () => {
  it("two concurrent resume(sameId) calls share a single engine", async () => {
    let count = 0;
    const fakes: FakeHandle[] = [];
    const factory = (): MiradexEngine => {
      count++;
      const f = createFakeEngine();
      // Hold the resume open so both callers race the same in-flight promise.
      f.setStartBehavior("pending");
      fakes.push(f);
      return f.engine;
    };
    const registry = new EngineRegistry({ engineFactory: factory });

    const a = registry.resume("MIRA-DEDUP");
    const b = registry.resume("MIRA-DEDUP");

    // Both promises are pending. Factory must have been called exactly once.
    expect(count).toBe(1);

    // Cancel pending work so the test exits cleanly: settle the engine's
    // resume by simulating completion.
    fakes[0]?.emitState({
      swap: { phase: "failed", snapshot: null, error: "abort" },
    });
    // Both `a` and `b` are still bound to engine.resume which is "pending"
    // — so they never resolve naturally. Cancel via destroy.
    registry.destroy("MIRA-DEDUP");

    // The pending resume promises will never resolve. Don't await them —
    // just verify the dedup guard worked.
    void a;
    void b;
  });
});
