"use client";

import { useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";
import { readKeystore, readProtocolSnapshot } from "@/lib/miradex-web/idb";
import { downloadFile } from "@/lib/download";
import type { FlowKind } from "./types";

type BackupCardProps = {
  readonly kind: FlowKind | null;
  readonly provider: string | null;
  readonly keystoreId: string | null;
  readonly serverSwapId: string | null;
  // SDK writes the snapshot at "Phase 3" (drive.ts maybeWriteSnapshot,
  // after /prepare + PSBT sign), AFTER serverSwapId is set. Keying a
  // useEffect on serverSwapId alone would miss it; re-check on phase ticks.
  readonly phase: string | null;
  // Foreign-browser branch only (atomic provider, no local keys). Wiring
  // is in SwapClient so the modal can re-open after "View only".
  readonly onImportKeystore?: () => void;
};

export function BackupCard({
  kind,
  provider,
  keystoreId,
  serverSwapId,
  phase,
  onImportKeystore,
}: BackupCardProps) {
  const [hasSnapshot, setHasSnapshot] = useState<boolean>(false);
  // provider = what the swap IS; kind = which engine flow drove it. On a
  // browser without the keystore, engine.resume falls back to SwapFlow
  // (kind='swap') even though provider='atomicswap'. Branch on provider.
  const isAtomicProvider = provider === "atomicswap";
  const hasLocalKeys = isAtomicProvider && kind === "atomic" && keystoreId !== null;

  useEffect(() => {
    if (!hasLocalKeys || serverSwapId === null) {
      setHasSnapshot(false);
      return;
    }
    // Snapshot existence is monotonic; recheck on phase ticks until found.
    if (hasSnapshot) return;
    let cancelled = false;
    void (async () => {
      const snap = await readProtocolSnapshot(serverSwapId).catch(() => null);
      if (!cancelled && snap !== null) setHasSnapshot(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasLocalKeys, serverSwapId, phase, hasSnapshot]);

  const onDownloadKeystore = async (): Promise<void> => {
    if (!keystoreId) return;
    const ks = await readKeystore(keystoreId).catch(() => null);
    if (ks === null) return;
    await downloadFile({
      content: JSON.stringify(ks, null, 2),
      filename: `miradex-keystore-${keystoreId}.json`,
      title: "Miradex keystore",
    });
  };

  const onDownloadSnapshot = async (): Promise<void> => {
    if (serverSwapId === null) return;
    const snap = await readProtocolSnapshot(serverSwapId).catch(() => null);
    if (snap === null) return;
    await downloadFile({
      content: snap,
      filename: `miradex-snapshot-${serverSwapId}.json`,
      title: "Miradex swap snapshot",
    });
  };

  return (
    <article className="rounded-xl border border-line-2 bg-bg/40 p-4 backdrop-blur-md">
      <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent">
        Backup
      </div>
      {hasLocalKeys ? (
        <>
          <p className="text-[12px] leading-[1.5] text-ink-mid">
            Save to your device. If your browser cache is wiped, re-import to resume the swap.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <BackupButton
              label="Keystore"
              onClick={onDownloadKeystore}
              disabled={keystoreId === null}
            />
            <BackupButton
              label="Snapshot"
              onClick={onDownloadSnapshot}
              disabled={!hasSnapshot}
            />
          </div>
        </>
      ) : isAtomicProvider ? (
        <>
          <p className="text-[12px] leading-[1.5] text-ink-mid">
            This browser doesn&apos;t hold the keys for this atomic swap. Open the URL in the
            browser where the swap was started to drive it to completion — or import the
            keystore here.
          </p>
          {onImportKeystore && (
            <button
              type="button"
              onClick={onImportKeystore}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line-2 bg-bg/30 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-bg/50"
            >
              <Upload className="h-3 w-3" aria-hidden="true" />
              Import keystore
            </button>
          )}
        </>
      ) : (
        <p className="text-[12px] leading-[1.5] text-ink-mid">
          Not applicable for this provider. The swap can be resumed by ID alone — no local key
          material is required.
        </p>
      )}
    </article>
  );
}

type BackupButtonProps = {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
};

function BackupButton({ label, onClick, disabled }: BackupButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-between rounded-lg border border-line-2 bg-bg/30 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-bg/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-2 disabled:hover:bg-bg/30"
    >
      <span>{label}</span>
      <Download className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}
