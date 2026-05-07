import { validateAddress as sdkValidateAddress } from "@miradexio/client";
import type { Token } from "../../web-components/types";
import { PROVIDER_DISPLAY } from "./constants";
import type { ProviderGrade, ProviderInfo } from "./types";

export function gradeBadgeClass(grade: ProviderGrade): string {
  if (grade === "S") {
    return "bg-green text-bg ring-1 ring-green/60";
  }
  if (grade === "A+") {
    return "bg-green/65 text-bg ring-1 ring-green/55";
  }
  if (grade === "A") {
    return "bg-green/35 text-ink ring-1 ring-green/40";
  }
  if (grade === "A-") {
    return "bg-green/20 text-ink ring-1 ring-green/30";
  }
  return "bg-accent/85 text-bg ring-1 ring-accent/60";
}

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
