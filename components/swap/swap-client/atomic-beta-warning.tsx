import { AlertTriangle, Check, Pencil } from "lucide-react";

type AtomicBetaWarningProps = {
  readonly acked: boolean;
  readonly onToggleAck: () => void;
};

// Above-deposit ack on atomic flows. Same UI pattern as ThorchainAmountWarning
// (amber checkbox toggle, accent confirm); copy is about keeping the tab open.
export function AtomicBetaWarning({ acked, onToggleAck }: AtomicBetaWarningProps) {
  if (acked) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-bg/15 bg-[#D8C8A2] px-3.5 py-2.5">
        <Check className="h-3.5 w-3.5 shrink-0 text-[#1F6B3A]" aria-hidden="true" />
        <span className="flex-1 truncate font-mono text-[11.5px] text-bg/75">
          Acknowledged — <span className="font-semibold text-bg">keep this tab open</span>.
        </span>
        <button
          type="button"
          onClick={onToggleAck}
          className="inline-flex items-center gap-1 rounded-md border border-bg/20 bg-bg/[0.05] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-bg/70 transition-colors hover:bg-bg/[0.10] hover:text-bg"
          aria-label="Re-confirm beta warning"
        >
          <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
          Edit
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggleAck}
      aria-pressed={false}
      className="flex w-full items-start gap-2.5 rounded-xl border-[1.5px] border-[#C2611B] bg-[#F0DCB4] px-3.5 py-2.5 text-left transition-colors hover:bg-[#E8D2A4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2611B]/60"
    >
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-[#C2611B] bg-surface/60"
        aria-hidden="true"
      />
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C2611B]" aria-hidden="true" />
      <span className="flex-1 font-mono text-[11.5px] leading-[1.4] text-bg">
        Atomic Swap is in <span className="font-semibold">BETA</span> and issues may occur. In
        the worst case, you can complete the swap from eigenwallet.{" "}
        <span className="font-semibold">Do not close this tab or browser</span> until the swap
        completes.
        <span className="mt-1.5 block font-semibold text-bg">
          I accept the risk and will keep this tab open
        </span>
      </span>
    </button>
  );
}

// Persisted under every id the swap may surface as: keystoreId (stable
// across the ?keystore=UUID -> ?id=MIRA-XXX URL upgrade) and swapNumber.
// Acking writes both, so a reload to either URL still finds the entry.
const STORAGE_KEY = "miradex-web:atomic-beta-acked";

function loadAcked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistAcked(set: ReadonlySet<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* private mode / quota — best effort */
  }
}

export function isAtomicBetaAcked(keys: readonly (string | null | undefined)[]): boolean {
  const set = loadAcked();
  return keys.some((k) => typeof k === "string" && k.length > 0 && set.has(k));
}

// Persisting under multiple keys handles the ?keystore=UUID -> ?id=MIRA-XXX
// URL upgrade race so both lookups succeed.
export function markAtomicBetaAcked(keys: readonly (string | null | undefined)[]): void {
  const next = loadAcked();
  for (const k of keys) {
    if (typeof k === "string" && k.length > 0) next.add(k);
  }
  persistAcked(next);
}

// Used when the user clicks "Edit".
export function unmarkAtomicBetaAcked(keys: readonly (string | null | undefined)[]): void {
  const next = loadAcked();
  for (const k of keys) {
    if (typeof k === "string" && k.length > 0) next.delete(k);
  }
  persistAcked(next);
}
