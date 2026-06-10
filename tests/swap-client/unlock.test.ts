import { describe, expect, it } from "vitest";
import { unlockPromptState } from "@/components/swap/swap-client/unlock";

describe("unlockPromptState", () => {
  it("shows nothing when the view is not restricted", () => {
    const state = unlockPromptState({
      restricted: false,
      provider: "thorchain",
      dismissed: false,
    });
    expect(state).toEqual({
      showCard: false,
      showReopenButton: false,
      useKeystorePrompt: false,
    });
  });

  it("uses the keystore import prompt for restricted atomic swaps", () => {
    const state = unlockPromptState({
      restricted: true,
      provider: "atomicswap",
      dismissed: false,
    });
    expect(state.useKeystorePrompt).toBe(true);
    expect(state.showCard).toBe(false);
    expect(state.showReopenButton).toBe(false);
  });

  it("shows the unlock card for restricted non-atomic swaps", () => {
    const state = unlockPromptState({
      restricted: true,
      provider: "thorchain",
      dismissed: false,
    });
    expect(state.showCard).toBe(true);
    expect(state.useKeystorePrompt).toBe(false);
  });

  it("collapses to the reopen button after the user skips", () => {
    const state = unlockPromptState({
      restricted: true,
      provider: "chainflip",
      dismissed: true,
    });
    expect(state.showCard).toBe(false);
    expect(state.showReopenButton).toBe(true);
  });

  it("treats an unknown provider as non-atomic", () => {
    const state = unlockPromptState({
      restricted: true,
      provider: null,
      dismissed: false,
    });
    expect(state.showCard).toBe(true);
    expect(state.useKeystorePrompt).toBe(false);
  });
});
