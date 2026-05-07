import { PROVIDER_LABELS, PROVIDER_LOGOS, TOKEN_ICON_BASE_URL } from "./constants";

export function providerLabel(name: string | null): string {
  if (!name) return "—";
  const key = name.toLowerCase();
  return PROVIDER_LABELS[key] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

export function providerLogo(name: string | null): string | null {
  if (!name) return null;
  return PROVIDER_LOGOS[name.toLowerCase()] ?? null;
}

export function tokenIconUrl(symbol: string | null): string | null {
  if (!symbol) return null;
  return `${TOKEN_ICON_BASE_URL}/${symbol.toLowerCase()}.svg`;
}
