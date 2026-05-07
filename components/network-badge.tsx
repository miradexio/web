"use client";

import { resolveWebConfig } from "@/lib/miradex-web/config";

const NETWORK_LABEL: Readonly<Record<"testnet" | "regtest", string>> = {
  testnet: "Testnet",
  regtest: "Regtest",
};

// Loud non-mainnet chip so a testnet swap can't be mistaken for real money.
// Null on mainnet — never bleeds into production-feeling UI.
export function NetworkBadge(): React.JSX.Element | null {
  const { network } = resolveWebConfig();
  if (network === "mainnet") return null;
  return (
    <div className="flex justify-end px-6 pb-2 md:px-8">
      <div className="inline-flex flex-col items-end gap-0.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-right">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          Running on {NETWORK_LABEL[network]} for atomic swaps
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-300/80">
          All other swaps are REAL
        </span>
      </div>
    </div>
  );
}
