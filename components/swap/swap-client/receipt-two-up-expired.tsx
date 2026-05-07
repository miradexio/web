"use client";

const PROVIDER_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  thorchain: "THORChain",
  chainflip: "Chainflip",
  near_intents: "NEAR Intents",
  atomicswap: "the swap counterparty",
};

function providerDisplay(provider: string | null): string {
  if (provider === null) return "the swap provider";
  return PROVIDER_DISPLAY_NAMES[provider] ?? "the swap provider";
}

export interface ReceiptExpiredProps {
  readonly errorMessage: string | null;
  readonly provider: string | null;
}

export function ReceiptExpired({ errorMessage, provider }: ReceiptExpiredProps): React.JSX.Element {
  const providerName = providerDisplay(provider);
  return (
    <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
        Expired
      </div>
      <p className="mt-1.5 text-[13.5px] font-medium leading-[1.45] text-bg">
        This swap expired on our end — no deposit detected on{" "}
        <span className="font-semibold">{providerName}</span>.
      </p>
      <p className="mt-1.5 font-mono text-[11px] leading-[1.5] text-bg/65">
        If you sent funds, check your wallet — your tx will still complete or refund on-chain on
        its own.
      </p>
      <p className="mt-1.5 font-mono text-[10.5px] leading-[1.5] text-bg/55">
        Need help?{" "}
        <a
          href="mailto:support@miradex.app"
          className="font-semibold text-bg underline-offset-2 hover:underline"
        >
          Contact support
        </a>
        .
      </p>
      {errorMessage && (
        <p className="mt-2 font-mono text-[10.5px] leading-[1.4] text-[#B41E28]">{errorMessage}</p>
      )}
    </div>
  );
}
