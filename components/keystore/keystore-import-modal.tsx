"use client";

import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import type { SwapKeystore } from "@miradexio/client";
import { resolveWebConfig } from "@/lib/miradex-web/config";
import {
  patchKeystoreSwapId,
  persistKeystore,
} from "@/lib/miradex-web/idb";

const DISMISS_KEY = "miradex-web:keystore-import-dismissed";

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (raw === null) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistDismissed(swapNumber: string): void {
  if (typeof window === "undefined") return;
  try {
    const seen = loadDismissed();
    if (seen.has(swapNumber)) return;
    seen.add(swapNumber);
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify([...seen]));
  } catch {
    /* private mode / quota — best effort */
  }
}

export function isImportDismissed(swapNumber: string): boolean {
  return loadDismissed().has(swapNumber);
}

interface SwapDetailLite {
  readonly fundingAddress: string;
  readonly destAddress: string;
  readonly refundAddress: string | null;
}

interface SwapDetailEnvelope {
  readonly success?: unknown;
  readonly data?: {
    readonly fundingAddress?: unknown;
    readonly destAddress?: unknown;
    readonly refundAddress?: unknown;
  };
}

async function fetchSwapDetail(swapNumber: string): Promise<SwapDetailLite> {
  const { apiUrl } = resolveWebConfig();
  const res = await fetch(`${apiUrl}/api/v1/swap/${encodeURIComponent(swapNumber)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`server returned HTTP ${res.status}`);
  const body = (await res.json()) as SwapDetailEnvelope;
  const d = body.data;
  if (
    typeof d?.fundingAddress !== "string" ||
    typeof d?.destAddress !== "string" ||
    d.fundingAddress.length === 0 ||
    d.destAddress.length === 0
  ) {
    throw new Error("server response missing expected fields");
  }
  return {
    fundingAddress: d.fundingAddress,
    destAddress: d.destAddress,
    refundAddress: typeof d.refundAddress === "string" ? d.refundAddress : null,
  };
}

function isSwapKeystore(input: unknown): input is SwapKeystore {
  if (typeof input !== "object" || input === null) return false;
  const k = input as Record<string, unknown>;
  if (k.version !== 3) return false;
  const btc = k.btc as Record<string, unknown> | undefined;
  if (typeof btc?.address !== "string" || typeof btc.wif !== "string") return false;
  const keys = k.keys as Record<string, unknown> | undefined;
  if (typeof keys?.s_b !== "string" || typeof keys.b !== "string") return false;
  const swap = k.swap as Record<string, unknown> | undefined;
  if (typeof swap?.receiveAddress !== "string" || typeof swap.refundAddress !== "string") {
    return false;
  }
  return true;
}

export function KeystoreImportModal({
  swapNumber,
  onClose,
  onImported,
}: {
  readonly swapNumber: string;
  readonly onClose: () => void;
  readonly onImported: () => void;
}): React.JSX.Element {
  const [detail, setDetail] = useState<SwapDetailLite | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // Fetch the swap detail once on mount so we know what to validate the
  // uploaded keystore against. Failure here means we can't safely validate
  // — fall back to error state and force the user to View Only.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const d = await fetchSwapDetail(swapNumber);
        if (!cancelled) setDetail(d);
      } catch (err: unknown) {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [swapNumber]);

  const handleFile = async (file: File | null): Promise<void> => {
    if (file === null || detail === null) return;
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("file is not valid JSON");
      }
      if (!isSwapKeystore(parsed)) {
        throw new Error("file is not a Miradex keystore (expected version 3)");
      }
      if (parsed.btc.address !== detail.fundingAddress) {
        throw new Error(
          `this keystore is for a different swap (funding address mismatch)`,
        );
      }
      if (parsed.swap.receiveAddress !== detail.destAddress) {
        throw new Error(
          `this keystore is for a different swap (destination address mismatch)`,
        );
      }
      const { id } = await persistKeystore(parsed, `Imported · ${swapNumber}`);
      await patchKeystoreSwapId(id, swapNumber);
      onImported();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleViewOnly = (): void => {
    persistDismissed(swapNumber);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keystore-import-title"
    >
      <div className="relative w-full max-w-[460px] rounded-2xl border border-bg/15 bg-surface p-5 text-bg shadow-2xl">
        <button
          type="button"
          onClick={handleViewOnly}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-bg/55 transition-colors hover:bg-bg/10 hover:text-bg"
          aria-label="Continue in view-only mode"
        >
          <X className="h-4 w-4" />
        </button>

        <h2
          id="keystore-import-title"
          className="text-[18px] font-semibold leading-tight"
        >
          This isn&apos;t the browser that started this swap
        </h2>
        <p className="mt-2 text-[13px] leading-[1.5] text-bg/75">
          Atomic swaps are non-custodial — driving one to completion requires
          the keystore that was generated when the swap was created. To drive
          this swap from this browser, import the keystore below. Otherwise
          you can continue in view-only mode and re-open the URL in the
          originating browser later.
        </p>

        {detailError !== null && (
          <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-[11px] leading-[1.5] text-red-200">
            Couldn&apos;t look up swap details to validate an imported
            keystore: {detailError}
          </p>
        )}

        {error !== null && (
          <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-[11px] leading-[1.5] text-red-200">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <label
            className={`inline-flex items-center justify-center gap-2 rounded-full border border-bg/15 bg-bg/[0.04] px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg backdrop-blur-sm transition-colors ${
              detail === null || busy
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:border-bg/40 hover:bg-bg/[0.08]"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            {busy ? "Importing…" : "Import keystore"}
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              disabled={detail === null || busy}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void handleFile(file);
                // Reset so re-selecting the same file re-fires onChange.
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={handleViewOnly}
            className="inline-flex items-center justify-center rounded-full border border-bg/15 bg-transparent px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg/70 transition-colors hover:border-bg/40 hover:text-bg"
          >
            View only
          </button>
        </div>
      </div>
    </div>
  );
}
