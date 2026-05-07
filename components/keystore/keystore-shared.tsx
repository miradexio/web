"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { DetectedDeposit, SwapKeystore } from "@miradexio/client";
import {
  buildSweepTx,
  estimateSweep,
  broadcastSweep,
  validateAddress,
} from "@miradexio/client";
import { createElectrsBlockchainProvider } from "@/lib/miradex-web/electrs-cors";
import { truncateMiddle } from "@/components/swap/swap-client/format";

// Labelled field + copy button. Shared by /keystores page and the in-context
// sheet (both render BTC funding/XMR receive/BTC refund/etc. with copy).
export function KeyRow({
  label,
  value,
  truncate,
  onCopy,
  copied,
  copyKey,
}: {
  readonly label: string;
  readonly value: string;
  readonly truncate: boolean;
  readonly onCopy: (value: string, key: string) => void;
  readonly copied: boolean;
  readonly copyKey: string;
}): React.JSX.Element {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-mid">{label}</div>
      <div className="mt-1 flex items-start gap-2">
        <code className="flex-1 break-all font-mono text-[11.5px] leading-[1.45] text-ink">
          {truncate ? truncateMiddle(value, 16, 12) : value}
        </code>
        <button
          type="button"
          onClick={() => onCopy(value, copyKey)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line-2 bg-bg/30 text-ink-mid transition-colors hover:border-line-2 hover:bg-bg/50"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="h-3 w-3 text-[#1F6B3A]" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}

// Pulls every UTXO at the keystore's funding address via electrs and
// broadcasts a sweep tx to the user's destination (fee deducted).
export function SweepModal({
  deposit,
  keystore,
  onClose,
  onSwept,
}: {
  readonly deposit: DetectedDeposit;
  readonly keystore: SwapKeystore;
  readonly onClose: () => void;
  readonly onSwept: () => void;
}): React.JSX.Element {
  const [destAddress, setDestAddress] = useState<string>("");
  const [estimating, setEstimating] = useState<boolean>(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [sentTxid, setSentTxid] = useState<string | null>(null);

  const network = keystore.btc.network;
  const validation = useMemo(() => {
    if (!destAddress) return { valid: false, message: "" };
    const result = validateAddress(destAddress, "BTC");
    return { valid: result.valid, message: result.valid ? "" : result.reason ?? "Invalid BTC address" };
  }, [destAddress]);

  const handleSweep = async (): Promise<void> => {
    if (!validation.valid) return;
    setSending(true);
    setEstimateError(null);
    try {
      const blockchain = createElectrsBlockchainProvider(network);
      const est = await estimateSweep(
        deposit,
        keystore.btc.address,
        destAddress,
        network,
        undefined,
        blockchain,
      );
      const rawHex = buildSweepTx(keystore.btc.wif, deposit, destAddress, est.sendSats, network);
      const txid = await broadcastSweep(rawHex, network, undefined, blockchain);
      setSentTxid(txid);
      window.setTimeout(onSwept, 1200);
    } catch (err) {
      setEstimateError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-[440px] rounded-2xl border border-bg/15 bg-surface p-5 text-bg shadow-2xl">
        <h2 className="text-[18px] font-semibold leading-tight">Sweep keystore</h2>
        <p className="mt-2 text-[12.5px] leading-[1.55] text-bg/75">
          Sends every UTXO at this keystore&apos;s funding address to a destination of your choice.
          Network fee is deducted from the amount.
        </p>
        <div className="mt-3 rounded-lg border border-bg/15 bg-bg/[0.04] p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-bg/60">
            Sweeping
          </div>
          <div className="mt-1 text-[15px] font-medium text-bg">
            {(deposit.value / 1e8).toFixed(8)}{" "}
            <span className="font-mono text-[11px] text-bg/65">BTC</span>
          </div>
        </div>
        <label className="mt-4 block">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-bg/65">
            Destination BTC address
          </span>
          <input
            type="text"
            value={destAddress}
            onChange={(e) => setDestAddress(e.target.value.trim())}
            placeholder="bc1… / bcrt1… / 1… / 3…"
            disabled={sending || sentTxid !== null}
            className="mt-1.5 w-full rounded-md border border-bg/20 bg-surface/60 px-2.5 py-2 font-mono text-[12px] text-bg placeholder:text-bg/35 focus:border-bg/60 focus:outline-none disabled:opacity-50"
          />
          {validation.message && destAddress && (
            <span className="mt-1 block font-mono text-[10px] text-[#B41E28]">{validation.message}</span>
          )}
        </label>
        {estimateError && (
          <p className="mt-3 font-mono text-[11px] leading-[1.4] text-[#B41E28]">{estimateError}</p>
        )}
        {sentTxid && (
          <p className="mt-3 font-mono text-[11px] leading-[1.4] text-[#1F6B3A]">
            Broadcast: {truncateMiddle(sentTxid, 12, 10)}
          </p>
        )}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="inline-flex items-center justify-center rounded-lg border border-bg/20 bg-bg/[0.05] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg/70 transition-colors hover:bg-bg/[0.10] hover:text-bg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setEstimating(true);
              void handleSweep().finally(() => setEstimating(false));
            }}
            disabled={!validation.valid || sending || estimating || sentTxid !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-bg px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "Broadcasting…" : sentTxid ? "Sent" : "Sweep"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Centralised so list and detail views render identically.
export function statusChipClass(status: string): string {
  if (status === "completed") return "border-green/40 bg-green/12 text-green";
  if (status === "swept" || status === "cancelled") return "border-line-2 bg-bg/30 text-ink-mid";
  return "border-accent/40 bg-accent/12 text-accent";
}
