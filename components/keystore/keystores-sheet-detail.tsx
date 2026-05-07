"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Play, RefreshCw, Trash2, Wand2 } from "lucide-react";
import type {
  DetectedDeposit,
  KeystoreMetadata,
  SwapKeystore,
} from "@miradexio/client";
import { listKeystoreMetadata, readKeystore } from "@/lib/miradex-web/idb";
import { fetchAddressUtxos } from "@/lib/miradex-web/electrs-cors";
import { useEngineActions } from "@/hooks/use-engine-actions";
import { KeyRow, SweepModal } from "@/components/keystore/keystore-shared";

type KeystoreNetwork = SwapKeystore["btc"]["network"];

interface SheetDetail {
  readonly keystore: SwapKeystore;
  readonly metadata: KeystoreMetadata;
}

export interface KeystoresSheetDetailProps {
  readonly id: string;
  /** Called after Resume / Start-new navigates so the sheet self-closes. */
  readonly onAfterAction: () => void;
  /** Open the parent's delete-confirmation overlay. */
  readonly onDelete: (id: string) => void;
}

export function KeystoresSheetDetail({
  id,
  onAfterAction,
  onDelete,
}: KeystoresSheetDetailProps): React.JSX.Element {
  const router = useRouter();
  const actions = useEngineActions();
  const [state, setState] = useState<SheetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deposit, setDeposit] = useState<DetectedDeposit | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sweepOpen, setSweepOpen] = useState<boolean>(false);

  // Load keystore body + metadata.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await listKeystoreMetadata().catch(() => []);
      const meta = list.find((k) => k.id === id);
      if (!meta) {
        if (!cancelled) setError("Keystore not found in this browser.");
        return;
      }
      const ks = await readKeystore(meta.id).catch(() => null);
      if (!ks) {
        if (!cancelled) setError("Failed to load keystore body.");
        return;
      }
      if (!cancelled) setState({ keystore: ks, metadata: meta });
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const network: KeystoreNetwork | null = state?.keystore.btc.network ?? null;

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!state || !network) return;
    setRefreshing(true);
    try {
      const det = await fetchAddressUtxos(state.keystore.btc.address, network);
      setDeposit(det);
      setBalanceError(null);
    } catch (err) {
      setBalanceError(err instanceof Error ? err.message : String(err));
      setDeposit(null);
    } finally {
      setRefreshing(false);
    }
  }, [state, network]);

  // Auto-refresh balance once metadata is loaded; mirrors KeystoreDetailDialog
  // on desktop where `runRefresh` runs from a useEffect on mount.
  useEffect(() => {
    if (!state || !network) return;
    void refreshBalance();
  }, [state, network, refreshBalance]);

  const handleCopy = useCallback((value: string, key: string): void => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1400);
    });
  }, []);

  const handleDownload = useCallback((): void => {
    if (!state) return;
    const blob = new Blob([JSON.stringify(state.keystore, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `miradex-keystore-${state.metadata.swapId ?? state.metadata.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const handleResume = useCallback((): void => {
    if (!state?.metadata.swapId) return;
    const swapId = state.metadata.swapId;
    void actions.resume(swapId).then(() => {
      router.push(`/?id=${encodeURIComponent(swapId)}`);
      onAfterAction();
    });
  }, [actions, router, state, onAfterAction]);

  // When the keystore is unbound from any swap (newly imported, or after a
  // failed-receipt restart cleared the swapId), offer a "Start new swap" path
  // that opens the quote page pre-filled and tagged with
  // ?reuseKeystore=<UUID>. Same URL contract the AtomicFailedReceipt's
  // Restart button uses — quote form picks it up via useSwapForm and threads
  // `existingKeystoreId` through to the SDK so the new swap binds to this
  // keystore's keys (no new keygen, same funding address; any BTC already
  // deposited gets consumed by the new TxLock).
  const handleStartNewSwap = useCallback((): void => {
    if (!state) return;
    const params = new URLSearchParams({
      from: "BTC",
      fromChain: "bitcoin",
      to: "XMR",
      toChain: "monero",
      amount: state.metadata.amount,
      reuseKeystore: state.metadata.id,
    });
    router.push(`/?${params.toString()}`);
    onAfterAction();
  }, [router, state, onAfterAction]);

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <div className="rounded-xl border border-line-2 bg-bg/40 p-6 text-center font-mono text-[11px] text-ink-mid backdrop-blur-md">
          {error}
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-center font-mono text-[11px] text-ink-mid">Loading…</p>
      </div>
    );
  }

  const balanceSats = deposit?.value ?? 0;
  const balanceBtc = (balanceSats / 1e8).toFixed(8);
  const canSweep = balanceSats > 0;
  const canResume =
    state.metadata.swapId !== null &&
    state.metadata.status !== "completed" &&
    state.metadata.status !== "swept" &&
    state.metadata.status !== "cancelled";

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <p className="mb-3 font-mono text-[10.5px] text-ink-mid">
        {state.metadata.amount} BTC · {network} · created{" "}
        {new Date(state.metadata.createdAt).toLocaleString()}
      </p>

      <WalletSection
        keystore={state.keystore}
        copiedKey={copiedKey}
        onCopy={handleCopy}
      />

      <BalanceSection
        balanceBtc={balanceBtc}
        refreshing={refreshing}
        balanceError={balanceError}
        balanceSats={balanceSats}
        onRefresh={refreshBalance}
      />

      <ActionRow
        canSweep={canSweep}
        canResume={canResume}
        canStartNew={state.metadata.swapId === null}
        onSweep={() => setSweepOpen(true)}
        onResume={handleResume}
        onStartNew={handleStartNewSwap}
        onDownload={handleDownload}
        onDelete={() => onDelete(id)}
      />

      {state.keystore.mnemonic && (
        <details className="mb-4 rounded-xl border border-line-2 bg-bg/40 p-4 backdrop-blur-md">
          <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
            Reveal recovery mnemonic
          </summary>
          <p className="mt-2 font-mono text-[12px] leading-[1.6] text-ink">
            {state.keystore.mnemonic}
          </p>
          <p className="mt-2 font-mono text-[9.5px] text-[#B41E28]">
            Anyone with this phrase can recover this keystore. Save it offline.
          </p>
        </details>
      )}

      {sweepOpen && deposit && (
        <SweepModal
          deposit={deposit}
          keystore={state.keystore}
          onClose={() => setSweepOpen(false)}
          onSwept={() => {
            setSweepOpen(false);
            void refreshBalance();
          }}
        />
      )}
    </div>
  );
}

function WalletSection({
  keystore,
  copiedKey,
  onCopy,
}: {
  readonly keystore: SwapKeystore;
  readonly copiedKey: string | null;
  readonly onCopy: (value: string, key: string) => void;
}): React.JSX.Element {
  return (
    <section className="mb-4 rounded-xl border border-line-2 bg-bg/40 p-4 backdrop-blur-md">
      <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
        Wallet
      </h3>
      <KeyRow
        label="BTC funding address"
        value={keystore.btc.address}
        truncate={false}
        onCopy={onCopy}
        copied={copiedKey === "btc-address"}
        copyKey="btc-address"
      />
      <KeyRow
        label="XMR receive address"
        value={keystore.swap.receiveAddress}
        truncate
        onCopy={onCopy}
        copied={copiedKey === "xmr-receive"}
        copyKey="xmr-receive"
      />
      <KeyRow
        label="BTC refund address"
        value={keystore.swap.refundAddress}
        truncate={false}
        onCopy={onCopy}
        copied={copiedKey === "btc-refund"}
        copyKey="btc-refund"
      />
    </section>
  );
}

function BalanceSection({
  balanceBtc,
  refreshing,
  balanceError,
  balanceSats,
  onRefresh,
}: {
  readonly balanceBtc: string;
  readonly refreshing: boolean;
  readonly balanceError: string | null;
  readonly balanceSats: number;
  readonly onRefresh: () => Promise<void>;
}): React.JSX.Element {
  return (
    <section className="mb-4 rounded-xl border border-line-2 bg-bg/40 p-4 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
          Balance
        </h3>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-1 rounded-md border border-line-2 bg-bg/30 px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-mid transition-colors hover:border-ink hover:text-ink disabled:cursor-wait disabled:opacity-50"
          aria-label="Refresh on-chain balance"
        >
          <RefreshCw
            className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {refreshing ? "Checking…" : "Refresh"}
        </button>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-medium tracking-[-0.025em] text-ink">{balanceBtc}</span>
        <span className="font-mono text-[12px] text-ink-mid">BTC</span>
      </div>
      {balanceError && (
        <p className="mt-1 font-mono text-[10px] text-[#B41E28]">
          Could not fetch live balance: {balanceError}
        </p>
      )}
      {!balanceError && balanceSats === 0 && !refreshing && (
        <p className="mt-1 font-mono text-[10px] text-ink-mid">
          No funds at the funding address.
        </p>
      )}
    </section>
  );
}

function ActionRow({
  canSweep,
  canResume,
  canStartNew,
  onSweep,
  onResume,
  onStartNew,
  onDownload,
  onDelete,
}: {
  readonly canSweep: boolean;
  readonly canResume: boolean;
  readonly canStartNew: boolean;
  readonly onSweep: () => void;
  readonly onResume: () => void;
  readonly onStartNew: () => void;
  readonly onDownload: () => void;
  readonly onDelete: () => void;
}): React.JSX.Element {
  return (
    <section className="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onSweep}
        disabled={!canSweep}
        className="inline-flex items-center gap-2 rounded-lg border border-line-2 bg-bg/30 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Wand2 className="h-3.5 w-3.5" />
        Sweep funds
      </button>
      {canResume && (
        <button
          type="button"
          onClick={onResume}
          className="inline-flex items-center gap-2 rounded-lg border border-line-2 bg-bg/30 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
        >
          <Play className="h-3.5 w-3.5" />
          Resume swap
        </button>
      )}
      {canStartNew && (
        <button
          type="button"
          onClick={onStartNew}
          className="inline-flex items-center gap-2 rounded-lg border border-line-2 bg-bg/30 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
        >
          <Play className="h-3.5 w-3.5" />
          Start new swap
        </button>
      )}
      <button
        type="button"
        onClick={onDownload}
        className="inline-flex items-center gap-2 rounded-lg border border-line-2 bg-bg/30 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
      >
        <Download className="h-3.5 w-3.5" />
        Download keystore
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-2 rounded-lg border border-[#B41E28]/40 bg-[#B41E28]/10 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B41E28] transition-colors hover:border-[#B41E28] hover:bg-[#B41E28]/15"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </section>
  );
}
