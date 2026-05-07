"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RotateCcw, ShieldAlert } from "lucide-react";
import { useEngineActions } from "@/hooks/use-engine-actions";
import { useTrade } from "@/hooks/use-trade";
import type { FlowView } from "./types";

type Props = {
  readonly view: FlowView;
  readonly flowId: string;
};

// Two CTAs:
//   Refresh — drop the engine, resume from server state. False negatives
//     come from Chainflip's REST indexer briefly lagging channel creation;
//     the next click catches an updated indexer and verify passes.
//   New Swap — bounce to / with the form pre-filled (tokens, chain,
//     amount, dest + refund). chainflip/thorchain/near_intents all surface
//     these on SwapDetail. Atomic restarts go through ?reuseKeystore=.
export function VerificationFailedCard({ view, flowId }: Props): React.JSX.Element {
  const router = useRouter();
  const actions = useEngineActions();
  const trade = useTrade(view.swapNumber ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (): Promise<void> => {
    if (refreshing || view.swapNumber === null) return;
    setRefreshing(true);
    try {
      // Drop the engine carrying the failed verify; the new flow re-runs
      // verify against fresh broker data.
      actions.destroy(flowId);
      await actions.resume(view.swapNumber);
    } catch {
      // Errors surface via the engine state stream; the card re-renders.
    } finally {
      setRefreshing(false);
    }
  };

  const handleNewSwap = (): void => {
    if (view.fromToken === null || view.toToken === null) return;
    const fromChain = trade.data?.fromChain ?? "";
    const toChain = trade.data?.toChain ?? "";
    const amount = view.depositAmount ?? trade.data?.amountIn ?? "";

    const params = new URLSearchParams();
    params.set("from", view.fromToken);
    if (fromChain.length > 0) params.set("fromChain", fromChain);
    params.set("to", view.toToken);
    if (toChain.length > 0) params.set("toChain", toChain);
    if (amount.length > 0) params.set("amount", amount);
    if (view.destAddress) params.set("destAddress", view.destAddress);
    if (view.refundAddress) params.set("refundAddress", view.refundAddress);

    router.push(`/?${params.toString()}`);
  };

  const canNewSwap = view.fromToken !== null && view.toToken !== null;

  return (
    <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
        Couldn&rsquo;t verify this swap
      </div>
      <p className="mt-1.5 text-[13.5px] font-medium leading-[1.45] text-bg">
        We couldn&rsquo;t confirm this deposit address with the provider. No
        funds have moved.
      </p>
      <p className="mt-1.5 font-mono text-[11px] leading-[1.5] text-bg/65">
        Verification can be a false negative when the provider&rsquo;s indexer
        is briefly behind. Refresh first — if it still fails, start a new
        swap and we&rsquo;ll keep the same details.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing || view.swapNumber === null}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-bg/30 bg-bg/[0.04] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bg/10 disabled:cursor-wait disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
        <button
          type="button"
          onClick={handleNewSwap}
          disabled={!canNewSwap}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-bg px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-surface transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New swap
        </button>
      </div>
    </div>
  );
}
