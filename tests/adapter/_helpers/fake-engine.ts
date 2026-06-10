import { EventEmitter } from "node:events";
import type { EngineState, FlowContext, MiradexEngine } from "@miradexio/client";

export interface FakeEngineCall {
  readonly method: string;
  readonly args: readonly unknown[];
}

export interface FakeEngineHandle {
  readonly engine: MiradexEngine;
  readonly calls: ReadonlyArray<FakeEngineCall>;
  emitState(partial: Partial<EngineState>): void;
  setStartBehavior(behavior: StartBehavior): void;
}

type StartBehavior = "resolve" | "throw" | "pending";

/**
 * Bare-minimum fake of MiradexEngine for registry tests. Exposes the surface
 * the registry consumes: `on`/`off`("state"), `.state`, `destroy`, plus the
 * start/resume methods (which record their invocations and otherwise do
 * nothing — tests drive the state via `emitState`).
 */
export function createFakeEngine(initial?: Partial<EngineState>): FakeEngineHandle {
  const emitter = new EventEmitter();
  const calls: FakeEngineCall[] = [];
  let currentState: EngineState = mergeState(buildInitialState(), initial ?? {});
  let nextStart: StartBehavior = "resolve";

  const record =
    (method: string) =>
    async (...args: readonly unknown[]): Promise<void> => {
      calls.push({ method, args });
      if (nextStart === "throw") {
        throw new Error(`fake engine ${method} threw`);
      }
      if (nextStart === "pending") {
        return new Promise<void>(() => undefined);
      }
    };

  const fake = {
    on: (event: string, listener: (...args: unknown[]) => void): void => {
      emitter.on(event, listener);
    },
    off: (event: string, listener: (...args: unknown[]) => void): void => {
      emitter.off(event, listener);
    },
    emit: (event: string, ...args: unknown[]): boolean =>
      emitter.emit(event, ...args),
    destroy: (): void => {
      calls.push({ method: "destroy", args: [] });
      emitter.removeAllListeners();
    },
    startSwap: record("startSwap"),
    startAtomicSwap: record("startAtomicSwap"),
    resume: record("resume"),
    resumeAtomicSwap: record("resumeAtomicSwap"),
    cancelSwap: (): void => {
      calls.push({ method: "cancelSwap", args: [] });
    },
    cancelAtomicSwap: (): void => {
      calls.push({ method: "cancelAtomicSwap", args: [] });
    },
    userCancel: (): void => {
      calls.push({ method: "userCancel", args: [] });
    },
    userRefund: (): void => {
      calls.push({ method: "userRefund", args: [] });
    },
    userRetrySweep: (): void => {
      calls.push({ method: "userRetrySweep", args: [] });
    },
    removeAllListeners: (): void => {
      emitter.removeAllListeners();
    },
  };

  Object.defineProperty(fake, "state", {
    get(): EngineState {
      return currentState;
    },
  });

  return {
    engine: fake as unknown as MiradexEngine,
    calls,
    emitState(partial: Partial<EngineState>): void {
      currentState = mergeState(currentState, partial);
      emitter.emit("state", currentState);
    },
    setStartBehavior(b: StartBehavior): void {
      nextStart = b;
    },
  };
}

function buildInitialState(): EngineState {
  return {
    activeFlow: "idle",
    swap: { phase: "idle", snapshot: null },
    atomic: { phase: "idle", snapshot: null },
  };
}

function mergeState(base: EngineState, patch: Partial<EngineState>): EngineState {
  return {
    activeFlow: patch.activeFlow ?? base.activeFlow,
    swap: patch.swap ?? base.swap,
    atomic: patch.atomic ?? base.atomic,
  };
}

/**
 * Build a `FlowContext`-shaped snapshot for tests. Only the fields the registry
 * reads (`keystoreId`, `swapId`) need real values; everything else defaults to
 * null so the shape passes the schema's nullability constraints.
 */
export function makeSnapshot(over: Partial<FlowContext> = {}): FlowContext {
  return {
    restricted: false,
    depositAddr: null,
    destAddress: null,
    refundAddress: null,
    keystoreId: null,
    depositAmount: null,
    fromToken: null,
    toToken: null,
    expectedOut: null,
    amountInUsd: null,
    expectedOutUsd: null,
    qr: null,
    verification: null,
    verificationSourceUrl: null,
    expiresAt: null,
    depositMemo: null,
    provider: null,
    swapId: null,
    swapNumber: null,
    extra: null,
    ...over,
  };
}
