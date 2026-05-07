"use client";

import { useSyncExternalStore } from "react";
import type { EngineState } from "@miradexio/client";
import { getRegistry } from "@/lib/miradex-web/registry";

export function useFlowEngine(idOrFlowId: string | null): EngineState | null {
  return useSyncExternalStore(
    (cb) => getRegistry().subscribe(cb),
    () => (idOrFlowId === null ? null : getRegistry().getStateOf(idOrFlowId)),
    () => null,
  );
}
