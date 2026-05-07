"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import type { KeystoreMetadata, SwapKeystore } from "@miradexio/client";
import {
  clearKeystoreSwapId,
  listKeystoreMetadata,
  readKeystore,
} from "@/lib/miradex-web/idb";
import { fetchAddressUtxos } from "@/lib/miradex-web/electrs-cors";
import { deleteSwapHistory } from "@/lib/storage/swap-history";
import { useEngineActions } from "@/hooks/use-engine-actions";

const SUPPORT_EMAIL = "support@miradex.app";

// Atomic-failed receipt branches on funding-address balance:
//   A (balance > 0):  "Maker timed out, funds safe" + Restart -> cleanup +
//                     /?from=...&reuseKeystore=
//   B (balance == 0): "Server/SDK error" — same-keystore restart can't reuse
//                     anything since the SDK reports failed without funds.
//   loading:          skeleton (don't pre-commit).
//   balance error:    soft-default to A with a footnote, since defaulting
//                     to B would gate a recoverable user behind support
//                     just because electrs was down.

export interface ReceiptAtomicFailedProps {
  readonly keystoreId: string;
  // Used by cleanup to destroy the dead engine. Null if the snapshot
  // didn't surface it pre-failure; cleanup degrades.
  readonly serverSwapId: string | null;
  // Subject line for the support-mailto.
  readonly swapNumber: string | null;
  readonly errorMessage: string | null;
}

interface BalanceCheckState {
  readonly status: "loading" | "ok" | "error";
  readonly balanceSats: number;
  readonly error: string | null;
}

export function ReceiptAtomicFailed({
  keystoreId,
  serverSwapId,
  swapNumber,
  errorMessage,
}: ReceiptAtomicFailedProps): React.JSX.Element {
  const router = useRouter();
  const actions = useEngineActions();
  const [keystore, setKeystore] = useState<{
    readonly body: SwapKeystore;
    readonly meta: KeystoreMetadata;
  } | null>(null);
  const [keystoreError, setKeystoreError] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceCheckState>({
    status: "loading",
    balanceSats: 0,
    error: null,
  });
  const [restarting, setRestarting] = useState<boolean>(false);

  // body -> BTC funding address; meta.amount -> user-input value pre-fees,
  // re-prefilled into the quote URL on restart.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listKeystoreMetadata();
        const meta = list.find((k) => k.id === keystoreId) ?? null;
        if (meta === null) {
          if (!cancelled) setKeystoreError("Keystore not found in this browser.");
          return;
        }
        const body = await readKeystore(keystoreId);
        if (!cancelled) setKeystore({ body, meta });
      } catch (err: unknown) {
        if (!cancelled) {
          setKeystoreError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [keystoreId]);

  // Drives Branch A vs B; on error soft-defaults to A (see header).
  useEffect(() => {
    if (keystore === null) return;
    let cancelled = false;
    void (async () => {
      try {
        const utxo = await fetchAddressUtxos(
          keystore.body.btc.address,
          keystore.body.btc.network,
        );
        if (!cancelled) {
          setBalance({ status: "ok", balanceSats: utxo?.value ?? 0, error: null });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setBalance({
            status: "error",
            balanceSats: 0,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [keystore]);

  const handleRestart = async (): Promise<void> => {
    if (keystore === null || restarting) return;
    setRestarting(true);
    try {
      // 1. Detach the keystore from the dead serverSwapId so a later
      //    resume(keystoreId) takes Path B (fresh swap) instead of Path A
      //    (resume the dead one). Idempotent on already-cleared rows.
      await clearKeystoreSwapId(keystoreId).catch(() => {});

      // 2. Delete the failed swap's history row. Atomic-flow history rows
      //    are keyed by flowId = keystoreId. Without this, the URL-upgrade
      //    effect in swap-client/index.tsx peeks history and replaces our
      //    next URL with `/?id=<MIRA-DEAD>` — re-stranding the user on the
      //    failed swap.
      await deleteSwapHistory(keystoreId).catch(() => {});

      // 3. Destroy the dead engine instance(s) so the registry doesn't keep
      //    emitting stale state for swaps we're walking away from. `destroy`
      //    is keyed by either id, so try both we have.
      if (serverSwapId !== null) actions.destroy(serverSwapId);
      actions.destroy(keystoreId);

      // 4. Navigate to the quote form pre-filled with the original swap's
      //    intent + the keystore-reuse signal. The form's submit path reads
      //    `reuseKeystore` and threads `existingKeystoreId` into
      //    `actions.startAtomicSwap` (use-swap-form.ts → use-swap.ts).
      const url = new URLSearchParams({
        from: "BTC",
        fromChain: "bitcoin",
        to: "XMR",
        toChain: "monero",
        amount: keystore.meta.amount,
        reuseKeystore: keystoreId,
      });
      router.push(`/?${url.toString()}`);
    } finally {
      setRestarting(false);
    }
  };

  // Render: keystore couldn't be loaded → degrade to a Branch-B-shaped
  // fallback. We can't offer Restart without a working keystore.
  if (keystoreError !== null) {
    return <FailedFallback errorMessage={errorMessage ?? keystoreError} swapNumber={swapNumber} />;
  }

  // Loading skeleton — keystore body or balance probe still in flight.
  if (keystore === null || balance.status === "loading") {
    return (
      <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-bg/65">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Checking your keystore…
        </div>
      </div>
    );
  }

  // Branch B — confirmed zero balance.
  if (balance.status === "ok" && balance.balanceSats === 0) {
    return <FailedFallback errorMessage={errorMessage} swapNumber={swapNumber} />;
  }

  // Branch A — funded, or balance unknown (electrs unreachable). The
  // unverified case shows a small footnote so the user understands the
  // assumption; the action remains available because gating it would strand
  // legitimately-funded users when an electrs operator hiccups.
  return (
    <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
        Swap failed — maker timed out
      </div>
      <p className="mt-1.5 text-[13.5px] font-medium leading-[1.45] text-bg">
        Your funds are safe in the swap keystore — they haven&apos;t moved on-chain.
      </p>
      <p className="mt-1.5 font-mono text-[11px] leading-[1.5] text-bg/65">
        Re-quote with a different maker. Same keystore, same deposit address — no need to send
        more BTC.
      </p>
      <button
        type="button"
        onClick={() => void handleRestart()}
        disabled={restarting}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-bg px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-surface transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {restarting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {restarting ? "Restarting…" : "Restart swap"}
      </button>
      {balance.status === "error" && (
        <p className="mt-2 font-mono text-[10px] leading-[1.4] text-bg/55">
          Couldn&apos;t verify keystore balance ({balance.error}). Restart anyway if you funded
          it — the new swap will detect the existing UTXO.
        </p>
      )}
      {errorMessage && (
        <p className="mt-2 font-mono text-[10.5px] leading-[1.4] text-[#B41E28]/80">
          Reason: {errorMessage}
        </p>
      )}
    </div>
  );
}

interface FailedFallbackProps {
  readonly errorMessage: string | null;
  readonly swapNumber: string | null;
}

function FailedFallback({ errorMessage, swapNumber }: FailedFallbackProps): React.JSX.Element {
  // Mailto with a pre-filled subject so the conversation correlates to the
  // failed swap without copy/paste gymnastics on either side.
  const subject = swapNumber ? `Help with swap ${swapNumber}` : "Help with a failed swap";
  const body = [
    swapNumber !== null ? `Swap number: ${swapNumber}` : null,
    errorMessage !== null ? `Reason reported: ${errorMessage}` : null,
    "",
    "What I was trying to do:",
    "",
    "What happened:",
    "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  const handleRefresh = (): void => {
    window.location.reload();
  };

  return (
    <div className="rounded-xl border border-bg/15 bg-[#D8C8A2] p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg/65">
        <AlertCircle className="h-3 w-3" aria-hidden="true" />
        Something went wrong
      </div>
      <p className="mt-1.5 text-[13.5px] font-medium leading-[1.45] text-bg">
        We couldn&apos;t recover this swap.
      </p>
      <p className="mt-1.5 font-mono text-[11px] leading-[1.5] text-bg/65">
        If you sent BTC to the deposit address, give the network a moment and refresh — your tx
        may still confirm. If it stays stuck, reach out and we&apos;ll investigate.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-bg/20 bg-bg/[0.05] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bg/[0.10]"
        >
          Refresh page
        </button>
        <a
          href={mailto}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-bg px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-surface transition-opacity hover:opacity-90"
        >
          Contact support
        </a>
      </div>
      {errorMessage && (
        <p className="mt-2 font-mono text-[10.5px] leading-[1.4] text-[#B41E28]/80">
          Reason: {errorMessage}
        </p>
      )}
    </div>
  );
}
