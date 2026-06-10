import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cacheProof,
  isUnlockDismissed,
  markUnlockDismissed,
  readCachedProof,
} from "@/lib/miradex-web/swap-proof";

function stubLocalStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
  });
  return store;
}

describe("swap-proof localStorage helpers", () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips a cached proof per swap number", () => {
    expect(readCachedProof("MIRA-AAAA1111")).toBeNull();
    cacheProof("MIRA-AAAA1111", "0xproof");
    expect(readCachedProof("MIRA-AAAA1111")).toBe("0xproof");
    expect(readCachedProof("MIRA-BBBB2222")).toBeNull();
  });

  it("round-trips the unlock dismissal flag per swap number", () => {
    expect(isUnlockDismissed("MIRA-AAAA1111")).toBe(false);
    markUnlockDismissed("MIRA-AAAA1111");
    expect(isUnlockDismissed("MIRA-AAAA1111")).toBe(true);
    expect(isUnlockDismissed("MIRA-BBBB2222")).toBe(false);
  });

  it("degrades to null/false when localStorage is unavailable", () => {
    vi.unstubAllGlobals();
    expect(readCachedProof("MIRA-AAAA1111")).toBeNull();
    expect(isUnlockDismissed("MIRA-AAAA1111")).toBe(false);
    expect(() => cacheProof("MIRA-AAAA1111", "x")).not.toThrow();
    expect(() => markUnlockDismissed("MIRA-AAAA1111")).not.toThrow();
  });
});
