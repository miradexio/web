"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { listKeystoreMetadata } from "@/lib/miradex-web/idb";
import { getRegistry } from "@/lib/miradex-web/registry";
import { KeystoresSheet } from "./keystores-sheet";

// Renders only when >=1 atomic keystore exists. Opens an overlay sheet
// (mirrors desktop's KeystoreDetailDialog) instead of navigating away.
export function KeystoresButton(): React.JSX.Element | null {
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = (): void => {
      void listKeystoreMetadata()
        .then((list) => {
          if (!cancelled) setCount(list.length);
        })
        .catch(() => {
          if (!cancelled) setCount(0);
        });
    };
    refresh();
    const unsub = getRegistry().subscribe(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  if (count === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-bg/40 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-mid transition-colors hover:border-line-2 hover:text-ink"
        aria-label={`Keystores (${count})`}
      >
        <KeyRound className="h-3.5 w-3.5" />
        Keystores
        <span className="rounded-full border border-line-2 bg-bg/30 px-1.5 py-px font-mono text-[9.5px] text-ink-mid">
          {count}
        </span>
      </button>
      <KeystoresSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
