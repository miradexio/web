import type { Token } from "../types";

const FAVORITES_STORAGE_KEY = "miradex:fav-tokens";

export function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return new Set();
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((s): s is string => typeof s === "string"));
  } catch {
    return new Set();
  }
}

export function saveFavorites(favorites: ReadonlySet<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // Storage may be unavailable; silently ignore
  }
}

export function tokenKey(t: Pick<Token, "coin" | "network">): string {
  return `${t.coin}::${t.network}`;
}
