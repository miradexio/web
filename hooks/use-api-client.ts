"use client";

import { useMemo } from "react";
import type { ApiClient } from "@miradexio/client";
import { getRegistry } from "@/lib/miradex-web/registry";

export function useApiClient(): ApiClient {
  return useMemo(() => getRegistry().apiClient, []);
}
