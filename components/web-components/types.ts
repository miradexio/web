import type { SwapKeystore } from "@miradexio/client";

export type Protocol = "chainflip" | "thorchain" | "near-intents";

export interface Token {
  coin: string;
  name: string;
  network: string;
  icon: string;
  hasExternalId: boolean;
  priceUsd?: string;
  change24hPct?: number;
}

export interface QuoteRequest {
  fromCoin: string;
  fromNetwork: string;
  toCoin: string;
  toNetwork: string;
  amount: number;
}

export interface Quote {
  provider: string;
  variantId: string;
  variantLabel: string;
  fromCoin: string;
  fromNetwork: string;
  toCoin: string;
  toNetwork: string;
  fromAmount: string;
  toAmount: string;
  fromAmountUsd?: string;
  toAmountUsd?: string;
  rate: number;
  fees: QuoteFee[];
  minerFee: string; // Aggregate of network/miner fees
  estimatedTime: string;
  estimatedDurationSeconds?: number;
  minAmount?: string | null;
  maxAmount?: string | null;
  priceImpactPct?: string;
  recommendedSlippageBps?: number;
  source: "cache" | "live" | "stale";
  precision?: string;
  competitors?: Competitor[];
}

export interface QuoteFee {
  type: string;
  amount: string;
  token: string;
  amountUsd?: string;
}

export interface Competitor {
  name: string;
  rate: number;
  toAmount: number;
}

export interface SwapRequest {
  fromCoin: string;
  fromNetwork: string;
  toCoin: string;
  toNetwork: string;
  amount: number;
  toAddress: string;
  fromAddress?: string;
  slippage?: number;
  telegramChatId?: string;
  keystore?: SwapKeystore;
}

export type TradeStatus =
  | "awaiting"
  | "received"
  | "converting"
  | "sending"
  | "complete"
  | "failed";

export interface TradeStep {
  step: number;
  label: string;
  status: "pending" | "active" | "done" | "failed";
  timestamp?: string;
  txHash?: string;
}

export interface Trade {
  id: string;
  fromCoin: string;
  fromNetwork: string;
  toCoin: string;
  toNetwork: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  status: TradeStatus;
  protocol?: Protocol;
  swapCode?: string;
  protocolData?: {
    channelId?: number;
    memo?: string;
    inboundTxHash?: string;
    outboundTxHash?: string;
    intentId?: string;
  };
  depositAddress: string;
  toAddress: string;
  fromAddress?: string;
  steps: TradeStep[];
  createdAt: string;
  updatedAt: string;
  depositTxHash?: string;
  outputTxHash?: string;
}

export interface RecentSwap {
  id: string;
  swapNumber: string;
  fromCoin: string;
  fromNetwork: string;
  toCoin: string;
  toNetwork: string;
  fromAmount: string;
  toAmount: string;
  amountInUsd?: string;
  expectedAmountOutUsd?: string;
  provider: string;
  status: string;
  createdAt: string;
  timeAgo: string;
  durationSeconds?: number;
}
