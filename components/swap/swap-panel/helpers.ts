import { validateAddress as sdkValidateAddress } from "@miradexio/client";
import type { Token } from "../../web-components/types";
import { PROVIDER_DISPLAY } from "./constants";
import type { ProviderInfo } from "./types";

export function validateAddress(addr: string, token: Token | null): string {
  if (!addr || !token) return "";
  const result = sdkValidateAddress(addr, token.network);
  if (result.valid) return "";
  return `Invalid ${token.coin} address${result.reason ? `: ${result.reason}` : ""}`;
}

export function getProviderDisplay(name: string): ProviderInfo {
  return (
    PROVIDER_DISPLAY[name.toLowerCase()] ?? {
      label: name.charAt(0).toUpperCase() + name.slice(1),
      color: "bg-ink-mid",
    }
  );
}
