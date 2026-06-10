export interface UnlockPromptInput {
  readonly restricted: boolean;
  readonly provider: string | null;
  readonly dismissed: boolean;
}

export interface UnlockPromptState {
  /** Show the dest-address unlock card (non-atomic restricted, not skipped). */
  readonly showCard: boolean;
  /** Card was skipped — show the small "Unlock full details" affordance. */
  readonly showReopenButton: boolean;
  /** Atomic swaps unlock via the keystore import modal, not an address. */
  readonly useKeystorePrompt: boolean;
}

export function unlockPromptState(input: UnlockPromptInput): UnlockPromptState {
  if (!input.restricted) {
    return { showCard: false, showReopenButton: false, useKeystorePrompt: false };
  }
  if (input.provider === "atomicswap") {
    return { showCard: false, showReopenButton: false, useKeystorePrompt: true };
  }
  return {
    showCard: !input.dismissed,
    showReopenButton: input.dismissed,
    useKeystorePrompt: false,
  };
}
