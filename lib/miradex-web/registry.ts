import { ApiClient, MiradexEngine } from "@miradexio/client";
import type {
  EngineConfig,
  EngineState,
  PlatformAdapter,
  StartAtomicSwapParams,
  StartSwapParams,
  SwapAction,
  SwapActionResponse,
} from "@miradexio/client";
import { BrowserAdapter } from "./browser-adapter";
import { resolveWebConfig } from "./config";
import { listKeystoreMetadata } from "./idb";

const SWAP_ID_TIMEOUT_MS = 30_000;
// Keygen (WASM) -> verifyKeys (server round-trip) -> saveKeystore (IDB).
// Local <1s, public API + slow network hits 5-15s on verifyKeys alone,
// Tor pushes it higher. 30s tolerates real latency without wedging the UI.
const KEYSTORE_ID_TIMEOUT_MS = 30_000;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuidShape(s: string): boolean {
  return UUID_REGEX.test(s);
}

function noop(): void {
  // intentionally empty — fire-and-forget catch
}

interface SwapStartResult {
  readonly flowId: string;
}

function waitForFirstSwapId(
  engine: MiradexEngine,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const onState = (state: EngineState): void => {
      const id = state.swap.snapshot?.swapId;
      if (typeof id === "string" && id.length > 0) {
        cleanup();
        resolve(id);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("timeout waiting for swap creation"));
    }, timeoutMs);
    const cleanup = (): void => {
      clearTimeout(timer);
      engine.off("state", onState);
    };
    engine.on("state", onState);
  });
}

function waitForFirstKeystoreId(
  engine: MiradexEngine,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const onState = (state: EngineState): void => {
      const id = state.atomic.snapshot?.keystoreId;
      if (typeof id === "string" && id.length > 0) {
        cleanup();
        resolve(id);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("timeout waiting for keystore creation"));
    }, timeoutMs);
    const cleanup = (): void => {
      clearTimeout(timer);
      engine.off("state", onState);
    };
    engine.on("state", onState);
  });
}

function firstFailure(
  engine: MiradexEngine,
  kind: "swap" | "atomic",
): Promise<never> {
  return new Promise((_resolve, reject) => {
    const onState = (state: EngineState): void => {
      if (kind === "swap" && state.swap.phase === "failed") {
        engine.off("state", onState);
        reject(new Error(state.swap.error));
        return;
      }
      if (kind === "atomic" && state.atomic.phase === "failed") {
        engine.off("state", onState);
        reject(new Error(state.atomic.error));
      }
    };
    engine.on("state", onState);
  });
}

export interface EngineRegistryOptions {
  readonly engineFactory?: (
    config: EngineConfig,
    adapter: PlatformAdapter,
  ) => MiradexEngine;
}

export class EngineRegistry {
  private readonly engines: Map<string, MiradexEngine> = new Map();
  private readonly bySwapId: Map<string, string> = new Map();
  private readonly byKeystoreId: Map<string, string> = new Map();
  private readonly indexBindings: Map<string, () => void> = new Map();
  private readonly pendingResume: Map<string, Promise<void>> = new Map();
  private readonly listeners: Set<() => void> = new Set();
  private readonly engineConfig: EngineConfig;
  private readonly adapter: PlatformAdapter;
  private readonly api: ApiClient;
  private readonly engineFactory: (
    config: EngineConfig,
    adapter: PlatformAdapter,
  ) => MiradexEngine;

  constructor(opts: EngineRegistryOptions = {}) {
    const resolved = resolveWebConfig();
    this.engineConfig = resolved.engineConfig;
    this.adapter = new BrowserAdapter();
    this.api = new ApiClient({
      baseUrl: resolved.apiUrl,
      timeout: resolved.engineConfig.apiTimeout,
      maxRetries: resolved.engineConfig.apiMaxRetries,
    });
    this.engineFactory =
      opts.engineFactory ?? ((cfg, ad) => new MiradexEngine(cfg, ad));
  }

  get apiClient(): ApiClient {
    return this.api;
  }

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  getStateOf(idOrFlowId: string): EngineState | null {
    const flowId = this.resolveFlowId(idOrFlowId);
    if (flowId === null) return null;
    const engine = this.engines.get(flowId);
    return engine === undefined ? null : engine.state;
  }

  getEngine(idOrFlowId: string): MiradexEngine | null {
    const flowId = this.resolveFlowId(idOrFlowId);
    if (flowId === null) return null;
    return this.engines.get(flowId) ?? null;
  }

  listFlowIds(): readonly string[] {
    return [...this.engines.keys()];
  }

  async startSwap(params: StartSwapParams): Promise<SwapStartResult> {
    const engine = this.createEngine();
    try {
      void engine.startSwap(params).catch(noop);
      const swapId = await Promise.race([
        waitForFirstSwapId(engine, SWAP_ID_TIMEOUT_MS),
        firstFailure(engine, "swap"),
      ]);
      this.engines.set(swapId, engine);
      this.bySwapId.set(swapId, swapId);
      this.bindStateIndex(engine, swapId);
      this.notify();
      return { flowId: swapId };
    } catch (err) {
      engine.destroy();
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  async startAtomicSwap(
    params: StartAtomicSwapParams,
  ): Promise<SwapStartResult> {
    const engine = this.createEngine();
    try {
      void engine.startAtomicSwap(params).catch(noop);
      const keystoreId = await Promise.race([
        waitForFirstKeystoreId(engine, KEYSTORE_ID_TIMEOUT_MS),
        firstFailure(engine, "atomic"),
      ]);
      this.engines.set(keystoreId, engine);
      this.byKeystoreId.set(keystoreId, keystoreId);
      this.bindStateIndex(engine, keystoreId);
      this.notify();
      return { flowId: keystoreId };
    } catch (err) {
      engine.destroy();
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  async resume(idOrFlowId: string): Promise<void> {
    if (this.resolveFlowId(idOrFlowId) !== null) return;
    const inflight = this.pendingResume.get(idOrFlowId);
    if (inflight !== undefined) return inflight;
    const work = this.resumeFresh(idOrFlowId);
    this.pendingResume.set(idOrFlowId, work);
    try {
      await work;
    } finally {
      this.pendingResume.delete(idOrFlowId);
    }
  }

  cancel(idOrFlowId: string): void {
    const flowId = this.resolveFlowId(idOrFlowId);
    if (flowId === null) return;
    const engine = this.engines.get(flowId);
    if (engine === undefined) return;
    if (engine.state.activeFlow === "atomic") {
      engine.cancelAtomicSwap();
    } else {
      engine.cancelSwap();
    }
  }

  executeAction(
    idOrFlowId: string,
    action: SwapAction,
  ): Promise<SwapActionResponse> {
    const flowId = this.resolveFlowId(idOrFlowId);
    const engine = flowId === null ? null : this.engines.get(flowId) ?? null;
    const serverSwapId =
      engine?.state.atomic.snapshot?.swapId ??
      engine?.state.swap.snapshot?.swapId ??
      idOrFlowId;
    return this.api.executeAction(serverSwapId, action);
  }

  userCancel(idOrFlowId: string): void {
    const flowId = this.resolveFlowId(idOrFlowId);
    if (flowId === null) return;
    this.engines.get(flowId)?.userCancel();
  }

  userRefund(idOrFlowId: string): void {
    const flowId = this.resolveFlowId(idOrFlowId);
    if (flowId === null) return;
    this.engines.get(flowId)?.userRefund();
  }

  userRetrySweep(idOrFlowId: string): void {
    const flowId = this.resolveFlowId(idOrFlowId);
    if (flowId === null) return;
    this.engines.get(flowId)?.userRetrySweep();
  }

  destroy(idOrFlowId: string): void {
    const flowId = this.resolveFlowId(idOrFlowId);
    if (flowId === null) return;
    const engine = this.engines.get(flowId);
    if (engine === undefined) return;
    this.indexBindings.get(flowId)?.();
    this.indexBindings.delete(flowId);
    engine.destroy();
    this.engines.delete(flowId);
    for (const [k, v] of this.bySwapId) if (v === flowId) this.bySwapId.delete(k);
    for (const [k, v] of this.byKeystoreId)
      if (v === flowId) this.byKeystoreId.delete(k);
    this.notify();
  }

  private resolveFlowId(idOrFlowId: string): string | null {
    if (this.engines.has(idOrFlowId)) return idOrFlowId;
    const viaSwap = this.bySwapId.get(idOrFlowId);
    if (viaSwap !== undefined && this.engines.has(viaSwap)) return viaSwap;
    const viaKs = this.byKeystoreId.get(idOrFlowId);
    if (viaKs !== undefined && this.engines.has(viaKs)) return viaKs;
    return null;
  }

  private async resumeFresh(idOrFlowId: string): Promise<void> {
    const engine = this.createEngine();
    if (isUuidShape(idOrFlowId)) {
      this.engines.set(idOrFlowId, engine);
      this.byKeystoreId.set(idOrFlowId, idOrFlowId);
      this.bindStateIndex(engine, idOrFlowId);
      this.notify();
      // useHistorySync writes the server swap number onto the keystore
      // when /swap/new returns. Pass it through so the engine takes Path A
      // (server lookup, full state recovery incl. terminal). Path B
      // would treat resume as a fresh swap and re-issue the deposit address.
      const list = await listKeystoreMetadata().catch(() => []);
      const ks = list.find((m) => m.id === idOrFlowId);
      const serverSwapId =
        ks?.swapId && ks.swapId.length > 0 ? ks.swapId : undefined;
      if (serverSwapId !== undefined) {
        // Pre-seed bySwapId so `/swap?id=<MIRA-XXX>` resolves immediately
        // when the URL upgrades.
        this.bySwapId.set(serverSwapId, idOrFlowId);
      }
      await engine.resumeAtomicSwap(idOrFlowId, serverSwapId);
      return;
    }
    this.engines.set(idOrFlowId, engine);
    this.bySwapId.set(idOrFlowId, idOrFlowId);
    this.bindStateIndex(engine, idOrFlowId);
    this.notify();
    await engine.resume(idOrFlowId);
  }

  private notify(): void {
    for (const cb of this.listeners) cb();
  }

  private createEngine(): MiradexEngine {
    return this.engineFactory(this.engineConfig, this.adapter);
  }

  private bindStateIndex(engine: MiradexEngine, flowId: string): void {
    const onState = (state: EngineState): void => {
      const atomicServerId = state.atomic.snapshot?.swapId;
      if (
        typeof atomicServerId === "string" &&
        atomicServerId.length > 0 &&
        this.bySwapId.get(atomicServerId) !== flowId
      ) {
        this.bySwapId.set(atomicServerId, flowId);
      }

      const swapServerId = state.swap.snapshot?.swapId;
      if (
        typeof swapServerId === "string" &&
        swapServerId.length > 0 &&
        this.bySwapId.get(swapServerId) !== flowId
      ) {
        this.bySwapId.set(swapServerId, flowId);
      }

      const ksId = state.atomic.snapshot?.keystoreId;
      if (
        typeof ksId === "string" &&
        ksId.length > 0 &&
        this.byKeystoreId.get(ksId) !== flowId
      ) {
        this.byKeystoreId.set(ksId, flowId);
      }

      this.notify();
    };
    engine.on("state", onState);
    this.indexBindings.set(flowId, () => engine.off("state", onState));
  }
}

let registryInstance: EngineRegistry | null = null;

export function getRegistry(): EngineRegistry {
  if (registryInstance === null) {
    registryInstance = new EngineRegistry();
  }
  return registryInstance;
}

export function resetRegistryForTests(): void {
  registryInstance = null;
}
