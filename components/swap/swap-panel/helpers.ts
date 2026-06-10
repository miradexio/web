import { validateAddress as sdkValidateAddress } from "@miradexio/client";
import type { Quote, Token } from "../../web-components/types";
import { PROVIDER_DISPLAY } from "./constants";
import type { ProviderInfo } from "./types";

export function validateAddress(addr: string, token: Token | null): string {
  if (!addr || !token) return "";
  const result = sdkValidateAddress(addr, token.network);
  if (result.valid) return "";
  return `That doesn't look like a valid ${token.coin} address — double-check and paste again`;
}

export function humanizeEta(quote: Pick<Quote, "estimatedTime" | "estimatedDurationSeconds">): string {
  const seconds = quote.estimatedDurationSeconds;
  if (seconds === undefined) return quote.estimatedTime;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `≈ ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `≈ ${hours} h ${rest} min` : `≈ ${hours} h`;
}

export function getProviderDisplay(name: string): ProviderInfo {
  return (
    PROVIDER_DISPLAY[name.toLowerCase()] ?? {
      label: name.charAt(0).toUpperCase() + name.slice(1),
      color: "bg-ink-mid",
    }
  );
}
