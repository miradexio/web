"use client";

import { useSyncExternalStore } from "react";
import { getRegistry } from "@/lib/miradex-web/registry";

const EMPTY: readonly string[] = Object.freeze([]);

export function useFlowList(): readonly string[] {
  return useSyncExternalStore(
    (cb) => getRegistry().subscribe(cb),
    () => getRegistry().listFlowIds(),
    () => EMPTY,
  );
}
