"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import type { EngineState } from "@miradexio/client";
import { readKeystore } from "@/lib/miradex-web/idb";
import { getRegistry } from "@/lib/miradex-web/registry";
import { downloadFile } from "@/lib/download";

interface KeystoreSnapshot {
  readonly id: string;
}


// Past these the swap is irrevocably done and the prompt is moot.
const TERMINAL_ATOMIC_PHASES: ReadonlySet<string> = new Set([
  "completed",
  "refunded",
  "cancelled",
  "punished",
  "failed",
]);

// Post-flowId-refactor the registry inserts the engine AFTER observing
// keystore-saved, so the engine is often already at awaiting-deposit by
// then. Pop on any non-terminal phase with a keystoreId; `seen` keeps it
// one-shot per keystore.
function readActiveAtomicKeystoreId(state: EngineState | null): string | null {
  if (!state) return null;
  if (state.atomic.phase === "idle") return null;
  if (TERMINAL_ATOMIC_PHASES.has(state.atomic.phase)) return null;
  const ks = state.atomic.snapshot?.keystoreId;
  return typeof ks === "string" && ks.length > 0 ? ks : null;
}

// Persisted across refreshes/tabs. Modal pops at most once per
// keystoreId per browser, ever.
const BACKUP_SEEN_KEY = "miradex-web:keystore-backup-seen";

function loadSeenKeystoreIds(): Set<string> {
  try {
    const raw = localStorage.getItem(BACKUP_SEEN_KEY);
    if (raw === null) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistSeenKeystoreId(id: string): void {
  try {
    const seen = loadSeenKeystoreIds();
    if (seen.has(id)) return;
    seen.add(id);
    localStorage.setItem(BACKUP_SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* private mode / quota — best effort */
  }
}

// Mounted once in Providers. Subscribes to the registry and pops a backup
// modal the first time it sees a new keystoreId. Dismiss + download both
// count as "seen" (onClose marks the id).
export function KeystoreBackupModalAuto(): React.JSX.Element | null {
  const [keystoreId, setKeystoreId] = useState<string | null>(null);

  useEffect(() => {
    const registry = getRegistry();
    const update = (): void => {
      const seen = loadSeenKeystoreIds();
      for (const id of registry.listFlowIds()) {
        const ks = readActiveAtomicKeystoreId(registry.getStateOf(id));
        if (ks && !seen.has(ks)) {
          // Mark seen immediately so concurrent state events don't re-open
          // the modal mid-interaction.
          persistSeenKeystoreId(ks);
          setKeystoreId(ks);
          return;
        }
      }
    };
    update();
    return registry.subscribe(update);
  }, []);

  if (!keystoreId) return null;
  return <KeystoreBackupModal keystoreId={keystoreId} onClose={() => setKeystoreId(null)} />;
}

// Stays open until dismissed. Engine may transition past keystore-saved
// while the modal is up; the keystore is already persisted, backup is
// still meaningful.
function KeystoreBackupModal({
  keystoreId,
  onClose,
}: {
  readonly keystoreId: string;
  readonly onClose: () => void;
}): React.JSX.Element {
  const handleDownload = async (): Promise<void> => {
    const ks = await readKeystore(keystoreId).catch(() => null);
    if (ks === null) return;
    await downloadFile({
      content: JSON.stringify(ks, null, 2),
      filename: `miradex-keystore-${keystoreId}.json`,
      title: "Miradex keystore",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keystore-backup-title"
    >
      <div className="relative w-full max-w-[420px] rounded-2xl border border-bg/15 bg-surface p-5 text-bg shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-bg/55 transition-colors hover:bg-bg/10 hover:text-bg"
          aria-label="Continue without downloading"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 id="keystore-backup-title" className="text-[18px] font-semibold leading-tight">
          Back up your swap wallet
        </h2>
        <p className="mt-2.5 text-[13px] leading-[1.55] text-bg/75">
          This swap creates a fresh wallet just for itself. We&apos;ve already saved it in your
          browser, but a downloaded copy gives you a portable backup you can hold onto.
        </p>
        <p className="mt-2.5 text-[13px] leading-[1.55] text-bg/65">
          You can come back to this anytime — it&apos;s also available under{" "}
          <span className="font-semibold text-bg">Keystores</span>. Even if the swap doesn&apos;t
          start, gets funded late, or you want to reuse the wallet later, the backup makes it
          possible to sweep funds out or restart.
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-bg/20 bg-bg/[0.05] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg/70 transition-colors hover:bg-bg/[0.10] hover:text-bg"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              void handleDownload().then(onClose);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-bg px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-surface transition-opacity hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" />
            Download backup
          </button>
        </div>
      </div>
    </div>
  );
}
