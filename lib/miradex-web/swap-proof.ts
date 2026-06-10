// localStorage cache for swap ownership proofs and unlock-prompt dismissals,
// keyed by swap number. Covers swaps with no IDB history row (foreign swap
// numbers unlocked manually) and pre-v5 rows without a stored destAddress.
// All helpers degrade silently when storage is unavailable (private mode,
// SSR, node tests without a stub).

const PROOF_KEY_PREFIX = "miradex.swapProof.";
const DISMISS_KEY_PREFIX = "miradex.unlockDismissed.";

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readCachedProof(swapNumber: string): string | null {
  try {
    return storage()?.getItem(`${PROOF_KEY_PREFIX}${swapNumber}`) ?? null;
  } catch {
    return null;
  }
}

export function cacheProof(swapNumber: string, destAddress: string): void {
  try {
    storage()?.setItem(`${PROOF_KEY_PREFIX}${swapNumber}`, destAddress);
  } catch {
    // best-effort cache — the user can re-enter the address
  }
}

export function isUnlockDismissed(swapNumber: string): boolean {
  try {
    return storage()?.getItem(`${DISMISS_KEY_PREFIX}${swapNumber}`) === "1";
  } catch {
    return false;
  }
}

export function markUnlockDismissed(swapNumber: string): void {
  try {
    storage()?.setItem(`${DISMISS_KEY_PREFIX}${swapNumber}`, "1");
  } catch {
    // best-effort — worst case the prompt reappears on reload
  }
}
