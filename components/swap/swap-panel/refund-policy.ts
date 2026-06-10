import type { Token } from "../../web-components/types";

// Mirrors the EIP-55 validator set in @miradexio/client: one key controls the
// same address on every one of these networks, so the destination address is
// a safe refund target on the source chain.
const EVM_NETWORKS: ReadonlySet<string> = new Set([
  "ethereum",
  "bsc",
  "polygon",
  "arbitrum",
  "avalanche",
  "base",
]);

export function isEvmNetwork(network: string): boolean {
  return EVM_NETWORKS.has(network.toLowerCase());
}

function isEvmPair(from: Token | null, to: Token | null): boolean {
  return from !== null && to !== null && isEvmNetwork(from.network) && isEvmNetwork(to.network);
}

export type RefundPolicyInput = {
  readonly from: Token | null;
  readonly to: Token | null;
  readonly hasSelectedQuote: boolean;
  readonly destAddr: string;
  readonly destError: string;
  readonly refundAddr: string;
  readonly refundError: string;
  readonly refundToDestination: boolean;
};

export type RefundPolicy = {
  readonly showRefundToDestinationToggle: boolean;
  readonly showRefundField: boolean;
  readonly effectiveRefundAddress: string;
  readonly isRefundReady: boolean;
};

// Refund controls stay hidden until the user has committed to a route
// (quote selected) and typed a valid destination — the refund prompt then
// reads as one more step of the same kind instead of an upfront hurdle.
export function resolveRefundPolicy(input: RefundPolicyInput): RefundPolicy {
  const hasTokenPair = input.from !== null && input.to !== null;
  const hasValidDestination = input.destAddr.length > 0 && !input.destError;
  const isRevealed = input.hasSelectedQuote && hasValidDestination && hasTokenPair;
  const canRefundToDestination = isEvmPair(input.from, input.to);
  const refundsToDestination = canRefundToDestination && input.refundToDestination;

  return {
    showRefundToDestinationToggle: isRevealed && canRefundToDestination,
    showRefundField: isRevealed && !refundsToDestination,
    effectiveRefundAddress: refundsToDestination ? input.destAddr : input.refundAddr,
    isRefundReady: refundsToDestination
      ? true
      : input.refundAddr.length > 0 && !input.refundError,
  };
}
