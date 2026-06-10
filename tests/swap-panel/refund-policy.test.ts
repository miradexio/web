import { describe, expect, it } from "vitest";
import {
  isEvmNetwork,
  resolveRefundPolicy,
  type RefundPolicyInput,
} from "@/components/swap/swap-panel/refund-policy";
import type { Token } from "@/components/web-components/types";

const VALID_EVM_ADDRESS = "0x2c7adbe4cd59d3259e45de1a74055e69ec2e2f6d";
const VALID_BTC_ADDRESS = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

function buildToken(overrides: Partial<Token>): Token {
  return {
    coin: "ETH",
    name: "Ethereum",
    network: "ethereum",
    icon: "",
    hasExternalId: false,
    ...overrides,
  };
}

function buildPolicyInput(overrides: Partial<RefundPolicyInput>): RefundPolicyInput {
  return {
    from: buildToken({ coin: "ETH", network: "ethereum" }),
    to: buildToken({ coin: "ARB", network: "arbitrum" }),
    hasSelectedQuote: true,
    destAddr: VALID_EVM_ADDRESS,
    destError: "",
    refundAddr: "",
    refundError: "",
    refundToDestination: true,
    ...overrides,
  };
}

describe("isEvmNetwork", () => {
  it.each(["ethereum", "bsc", "polygon", "arbitrum", "avalanche", "base"])(
    "treats %s as EVM",
    (network) => {
      expect(isEvmNetwork(network)).toBe(true);
    },
  );

  it.each(["bitcoin", "monero", "solana", "litecoin"])("treats %s as non-EVM", (network) => {
    expect(isEvmNetwork(network)).toBe(false);
  });

  it("ignores casing", () => {
    expect(isEvmNetwork("Ethereum")).toBe(true);
  });
});

describe("resolveRefundPolicy", () => {
  describe("EVM to EVM pair with refund-to-destination on", () => {
    it("shows the toggle instead of the refund field", () => {
      const policy = resolveRefundPolicy(buildPolicyInput({}));

      expect(policy.showRefundToDestinationToggle).toBe(true);
      expect(policy.showRefundField).toBe(false);
    });

    it("uses the destination address as the effective refund address", () => {
      const policy = resolveRefundPolicy(buildPolicyInput({}));

      expect(policy.effectiveRefundAddress).toBe(VALID_EVM_ADDRESS);
    });

    it("is refund-ready without a typed refund address", () => {
      const policy = resolveRefundPolicy(buildPolicyInput({ refundAddr: "" }));

      expect(policy.isRefundReady).toBe(true);
    });

    it("ignores a stale refund validation error", () => {
      const policy = resolveRefundPolicy(
        buildPolicyInput({ refundAddr: "junk", refundError: "Invalid ETH address" }),
      );

      expect(policy.isRefundReady).toBe(true);
      expect(policy.effectiveRefundAddress).toBe(VALID_EVM_ADDRESS);
    });
  });

  describe("EVM to EVM pair with refund-to-destination off", () => {
    it("shows both the toggle and the refund field", () => {
      const policy = resolveRefundPolicy(buildPolicyInput({ refundToDestination: false }));

      expect(policy.showRefundToDestinationToggle).toBe(true);
      expect(policy.showRefundField).toBe(true);
    });

    it("uses the typed refund address as the effective refund address", () => {
      const policy = resolveRefundPolicy(
        buildPolicyInput({ refundToDestination: false, refundAddr: VALID_EVM_ADDRESS }),
      );

      expect(policy.effectiveRefundAddress).toBe(VALID_EVM_ADDRESS);
    });

    it("is not refund-ready until a refund address is typed", () => {
      const policy = resolveRefundPolicy(
        buildPolicyInput({ refundToDestination: false, refundAddr: "" }),
      );

      expect(policy.isRefundReady).toBe(false);
    });

    it("is not refund-ready while the typed refund address is invalid", () => {
      const policy = resolveRefundPolicy(
        buildPolicyInput({
          refundToDestination: false,
          refundAddr: "junk",
          refundError: "Invalid ETH address",
        }),
      );

      expect(policy.isRefundReady).toBe(false);
    });
  });

  describe("cross-format pair (bitcoin to ethereum)", () => {
    function buildCrossFormatInput(overrides: Partial<RefundPolicyInput>): RefundPolicyInput {
      return buildPolicyInput({
        from: buildToken({ coin: "BTC", network: "bitcoin" }),
        to: buildToken({ coin: "ETH", network: "ethereum" }),
        ...overrides,
      });
    }

    it("never offers the refund-to-destination toggle", () => {
      const policy = resolveRefundPolicy(buildCrossFormatInput({}));

      expect(policy.showRefundToDestinationToggle).toBe(false);
      expect(policy.showRefundField).toBe(true);
    });

    it("requires a typed refund address even when refund-to-destination is on", () => {
      const policy = resolveRefundPolicy(buildCrossFormatInput({ refundToDestination: true }));

      expect(policy.isRefundReady).toBe(false);
      expect(policy.effectiveRefundAddress).toBe("");
    });

    it("is refund-ready once a valid refund address is typed", () => {
      const policy = resolveRefundPolicy(
        buildCrossFormatInput({ refundAddr: VALID_BTC_ADDRESS }),
      );

      expect(policy.isRefundReady).toBe(true);
      expect(policy.effectiveRefundAddress).toBe(VALID_BTC_ADDRESS);
    });
  });

  describe("reveal gating", () => {
    it("hides both controls until a quote is selected", () => {
      const policy = resolveRefundPolicy(buildPolicyInput({ hasSelectedQuote: false }));

      expect(policy.showRefundToDestinationToggle).toBe(false);
      expect(policy.showRefundField).toBe(false);
    });

    it("hides both controls until the destination address is entered", () => {
      const policy = resolveRefundPolicy(buildPolicyInput({ destAddr: "" }));

      expect(policy.showRefundToDestinationToggle).toBe(false);
      expect(policy.showRefundField).toBe(false);
    });

    it("hides both controls while the destination address is invalid", () => {
      const policy = resolveRefundPolicy(
        buildPolicyInput({ destAddr: "junk", destError: "Invalid ARB address" }),
      );

      expect(policy.showRefundToDestinationToggle).toBe(false);
      expect(policy.showRefundField).toBe(false);
    });

    it("hides both controls while no tokens are selected", () => {
      const policy = resolveRefundPolicy(buildPolicyInput({ from: null, to: null }));

      expect(policy.showRefundToDestinationToggle).toBe(false);
      expect(policy.showRefundField).toBe(false);
    });
  });
});
