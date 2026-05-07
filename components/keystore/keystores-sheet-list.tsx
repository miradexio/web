"use client";

import { ChevronRight, KeyRound, Trash2 } from "lucide-react";
import type { KeystoreMetadata } from "@miradexio/client";

export interface KeystoresSheetListProps {
  readonly keystores: readonly KeystoreMetadata[] | null;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function KeystoresSheetList({
  keystores,
  onSelect,
  onDelete,
}: KeystoresSheetListProps): React.JSX.Element {
  if (keystores === null) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-center font-mono text-[11px] text-ink-mid">Loading…</p>
      </div>
    );
  }
  if (keystores.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line-2 bg-bg/40 p-6 text-center backdrop-blur-md">
          <KeyRound className="h-6 w-6 text-ink-dim" aria-hidden="true" />
          <p className="text-[13px] leading-[1.55] text-ink-mid">
            No keystores yet. Start an atomic swap (BTC → XMR) and one will appear here.
          </p>
        </div>
      </div>
    );
  }
  // Newest first. Sort the rendered copy so the underlying array (cached
  // by the parent) isn't mutated and a stable order survives re-mounts.
  const sorted = [...keystores].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
        {sorted.length} {sorted.length === 1 ? "keystore" : "keystores"}
      </p>
      <ul className="flex flex-col gap-2">
        {sorted.map((k) => (
          <KeystoreRow key={k.id} keystore={k} onSelect={onSelect} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  );
}

function KeystoreRow({
  keystore,
  onSelect,
  onDelete,
}: {
  readonly keystore: KeystoreMetadata;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
}): React.JSX.Element {
  return (
    <li>
      <div className="group relative flex items-stretch gap-2 rounded-xl border border-line-2 bg-bg/40 backdrop-blur-md transition-colors hover:border-line-2 hover:bg-bg/60">
        <button
          type="button"
          onClick={() => onSelect(keystore.id)}
          className="flex flex-1 items-center gap-3 p-4 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line-2 bg-bg/30 text-ink-mid">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[12px] text-ink">
              {keystore.amount} <span className="text-ink-mid">BTC</span>
            </div>
            {/* Full BTC funding address — wraps over multiple lines on narrow
                viewports (mobile). break-all so long addresses don't push the
                row width past the container. */}
            <div className="mt-1 break-all font-mono text-[10.5px] leading-[1.45] text-ink-mid">
              {keystore.btcAddress}
            </div>
            {keystore.swapId && (
              <div className="mt-0.5 truncate font-mono text-[10px] text-accent">
                {keystore.swapId}
              </div>
            )}
            <div className="mt-0.5 font-mono text-[9.5px] text-ink-dim">
              Created {new Date(keystore.createdAt).toLocaleString()}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-dim" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(keystore.id);
          }}
          className="flex w-10 shrink-0 items-center justify-center rounded-r-xl text-ink-dim transition-colors hover:bg-[#B41E28]/10 hover:text-[#B41E28]"
          aria-label={`Delete keystore for ${keystore.amount} BTC`}
          title="Delete keystore"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
