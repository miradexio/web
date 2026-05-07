"use client";

import { useMemo } from "react";
import type {
  StartAtomicSwapParams,
  StartSwapParams,
  SwapAction,
  SwapActionResponse,
} from "@miradexio/client";
import { getRegistry } from "@/lib/miradex-web/registry";

export interface EngineActions {
  readonly startSwap: (params: StartSwapParams) => Promise<{ readonly flowId: string }>;
  readonly startAtomicSwap: (
    params: StartAtomicSwapParams,
  ) => Promise<{ readonly flowId: string }>;
  // The following methods accept any of `flowId`, server `swapId`, or
  // `keystoreId` — the registry resolves through its index maps. The
  // parameter name stays `idOrFlowId` to make the polymorphism explicit.
  readonly resume: (idOrFlowId: string) => Promise<void>;
  readonly cancel: (idOrFlowId: string) => void;
  readonly destroy: (idOrFlowId: string) => void;
  readonly executeAction: (
    idOrFlowId: string,
    action: SwapAction,
  ) => Promise<SwapActionResponse>;
  readonly userCancel: (idOrFlowId: string) => void;
  readonly userRefund: (idOrFlowId: string) => void;
  readonly userRetrySweep: (idOrFlowId: string) => void;
}

export function useEngineActions(): EngineActions {
  return useMemo<EngineActions>(() => {
    const registry = getRegistry();
    return {
      startSwap: (params) => registry.startSwap(params),
      startAtomicSwap: (params) => registry.startAtomicSwap(params),
      resume: (id) => registry.resume(id),
      cancel: (id) => registry.cancel(id),
      destroy: (id) => registry.destroy(id),
      executeAction: (id, action) => registry.executeAction(id, action),
      userCancel: (id) => registry.userCancel(id),
      userRefund: (id) => registry.userRefund(id),
      userRetrySweep: (id) => registry.userRetrySweep(id),
    };
  }, []);
}
