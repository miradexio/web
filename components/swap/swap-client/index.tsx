"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useFlowEngine } from "@/hooks/use-flow-engine";
import { useEngineActions } from "@/hooks/use-engine-actions";
import { loadSwapHistoryEntry } from "@/lib/storage/swap-history";
import { CardHeader } from "./card-header";
import { copyToClipboard } from "./clipboard";
import { HeadlinesCard } from "@/components/swap/swap-panel/headlines-card";
import { BackupCard } from "./backup-card";
import {
  KeystoreImportModal,
  isImportDismissed,
} from "@/components/keystore/keystore-import-modal";
import { CANCEL_FLOW_PHASES, TERMINAL_PHASES } from "./constants";
import { DepositTwoUp } from "./deposit-two-up";
import { PairSummary } from "./pair-summary";
import { PendingPanel } from "./pending-panel";
import { Pipeline } from "./pipeline";
import { ReceiptTwoUp } from "./receipt-two-up";
import { ReviewLinksCard } from "./review-links-card";
import { shouldShowReviewLinks } from "./review-links";
import {
  AtomicBetaWarning,
  isAtomicBetaAcked,
  markAtomicBetaAcked,
  unmarkAtomicBetaAcked,
} from "./atomic-beta-warning";
import { UnlockCard } from "./unlock-card";
import { unlockPromptState } from "./unlock";
import { isUnlockDismissed, markUnlockDismissed } from "@/lib/miradex-web/swap-proof";
import { ShellMessage } from "./shell-message";
import { ThorchainAmountWarning } from "./thorchain-amount-warning";
import { VerificationCard } from "./verification-card";
import { VerificationFailedCard } from "./verification-failed-card";
import { phaseTone, pipelineStageOf, presentedPhase, viewFromState } from "./view";
import type { FlowView } from "./types";

const COPY_FEEDBACK_MS = 1400;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuidShape(s: string): boolean {
  return UUID_REGEX.test(s);
}

export default function SwapClient(): React.JSX.Element {
  const params = useSearchParams();
  const router = useRouter();
  // URL semantics — strict:
  //   ?id=<MIRA-…>     — canonical, only valid for server-issued swap ids
  //   ?keystore=<UUID> — transient, only valid for atomic keystoreId UUIDs
  // Mismatched shapes (e.g. ?id=<UUID> from an old bookmark) are treated as
  // invalid and redirected back to /swap. No silent migration.
  const idParam = params.get("id")?.trim() ?? "";
  const keystoreParam = params.get("keystore")?.trim() ?? "";
  const idValid = idParam.length > 0 && !isUuidShape(idParam);
  const keystoreValid = keystoreParam.length > 0 && isUuidShape(keystoreParam);
  const hasAnyParam = idParam.length > 0 || keystoreParam.length > 0;
  const flowId = idValid ? idParam : keystoreValid ? keystoreParam : "";
  const usingKeystoreParam = !idValid && keystoreValid;

  const state = useFlowEngine(flowId);
  const actions = useEngineActions();

  const [resumeError, setResumeError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // Per-render dismissal of the keystore-import modal. Eligibility
  // (foreign-browser + atomic + non-terminal) is computed below; this state
  // just lets "View only" hide the modal in this session even before the
  // localStorage dismissal flag is read on next mount.
  const [importPromptOpen, setImportPromptOpen] = useState<boolean>(true);
  // Manual import trigger from the BackupCard "Import keystore" button.
  // Bypasses the auto-prompt eligibility (which respects per-swap
  // dismissal) — clicking the button is an explicit user request to open
  // the modal regardless of prior dismissal.
  const [manualImportOpen, setManualImportOpen] = useState<boolean>(false);
  // Bumped whenever the user toggles the atomic-beta ack so derived values
  // re-read localStorage. The persisted set is keyed by both keystoreId and
  // swapNumber, so the ack survives page reloads and the
  // `?keystore=UUID` → `?id=MIRA-XXX` URL upgrade.
  const [atomicBetaAckTick, setAtomicBetaAckTick] = useState<number>(0);
  // Per-swap exact-amount acknowledgement gate. Reset whenever the
  // (flowId, depositAmount) pair changes so a re-quoted amount can't carry a
  // stale ack — and so a page reload re-prompts (intentional: makes the user
  // re-read the warning when they resume a swap).
  const [thorchainAck, setThorchainAck] = useState<{
    readonly flowId: string;
    readonly amount: string;
  } | null>(null);
  // Restricted-view unlock state, keyed by flowId (same pattern as
  // thorchainAck) so nothing leaks across swaps without an effect-reset.
  // `attempted` drives the "address doesn't match" hint: if the user
  // submitted a proof and the view is STILL restricted after the rebuilt
  // engine emits, the address was wrong. `reopened` overrides a persisted
  // Skip for this render session; `dismissTick` re-reads localStorage.
  const [unlockSession, setUnlockSession] = useState<{
    readonly flowId: string;
    readonly attempted: boolean;
    readonly reopened: boolean;
  } | null>(null);
  const [unlockDismissTick, setUnlockDismissTick] = useState<number>(0);

  // Invalid URL params (e.g. ?id=<UUID> from an old bookmark) — bounce to
  // the swap form. No popups, no engine work.
  useEffect(() => {
    if (hasAnyParam && flowId.length === 0) {
      router.replace("/");
    }
  }, [hasAnyParam, flowId, router]);

  useEffect(() => {
    if (flowId.length === 0) return;
    let cancelled = false;
    void actions.resume(flowId).catch((err: unknown) => {
      if (cancelled) return;
      const msg = err instanceof Error ? err.message : String(err);
      // Keystore not in IDB on this browser (typo, cleared storage, foreign
      // share). Don't render a swap-detail page for a swap we can't recover —
      // bounce back to the form.
      if (/keystore not found/i.test(msg)) {
        router.replace("/");
        return;
      }
      setResumeError(msg);
    });
    return () => {
      cancelled = true;
    };
  }, [actions, flowId, router]);

  const view = useMemo<FlowView | null>(() => viewFromState(state), [state]);

  // Upgrade the URL from /swap?keystore=<UUID> → /swap?id=<MIRA-XXX> the
  // moment we know the server's number. Two paths:
  //   • Live: engine state surfaces `serverSwapId` during this session.
  //   • Deep-link / refresh: the swap_history row already has
  //     `serverSwapId` (useHistorySync writes it once it surfaces on the
  //     atomic snapshot), so we can redirect before the engine even
  //     starts emitting state.
  // Use `replace` (not `push`) so the keystoreId URL doesn't pollute history.
  useEffect(() => {
    if (flowId.length === 0) return;
    // Already on the canonical id-shape URL — nothing to upgrade.
    if (!usingKeystoreParam && !isUuidShape(flowId)) return;

    // Path 1: live state surfaced the server id.
    const liveServerId = view?.serverSwapId ?? null;
    if (liveServerId !== null && liveServerId !== flowId) {
      router.replace(`/?id=${encodeURIComponent(liveServerId)}`);
      return;
    }

    // Path 2: peek swap_history for a row that already has the server id.
    let cancelled = false;
    void (async () => {
      const row = await loadSwapHistoryEntry(flowId).catch(() => null);
      if (cancelled) return;
      if (row?.serverSwapId && row.serverSwapId.length > 0 && row.serverSwapId !== flowId) {
        router.replace(`/?id=${encodeURIComponent(row.serverSwapId)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flowId, usingKeystoreParam, view?.serverSwapId, router]);
  const expiresAt = view?.expiresAt ?? null;

  useEffect(() => {
    if (expiresAt === null || expiresAt.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const timeLeftMs = useMemo<number | null>(() => {
    if (expiresAt === null || expiresAt.length === 0) return null;
    return Math.max(0, new Date(expiresAt).getTime() - now);
  }, [expiresAt, now]);

  const handleCopy = useCallback((value: string, key: string) => {
    if (!value) return;
    void copyToClipboard(value);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, COPY_FEEDBACK_MS);
  }, []);

  if (view === null && resumeError === null) {
    return <ShellMessage label="Restoring swap" />;
  }

  if (view === null) {
    return (
      <ShellMessage
        label="Swap not found"
        message={
          resumeError ??
          "The browser doesn't have local state for this id. If you started the swap on another device, the live keys may have been lost."
        }
        action={
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-bg/30 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur-sm transition-colors hover:border-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to swap
          </button>
        }
      />
    );
  }

  const isTerminal = TERMINAL_PHASES.has(view.phase);
  const isCancelFlow = CANCEL_FLOW_PHASES.has(view.phase);
  // Restricted pre-deposit swaps park on `creating-swap` in the SDK; present
  // them as awaiting-deposit (label + pipeline stage) — see presentedPhase.
  const displayPhase = presentedPhase(view);
  const stage = pipelineStageOf({ ...view, phase: displayPhase });
  const tone = phaseTone(displayPhase);

  // Restricted (no ownership proof) prompt routing. Atomic swaps unlock by
  // importing the keystore (it holds the receive address); everything else
  // unlocks with the destination address. `unlockDismissTick` is read so a
  // Skip persisted to localStorage re-renders immediately.
  void unlockDismissTick;
  const unlockAttempted = unlockSession?.flowId === flowId && unlockSession.attempted;
  const unlockReopened = unlockSession?.flowId === flowId && unlockSession.reopened;
  const unlockDismissed =
    !unlockReopened && view.swapNumber !== null && isUnlockDismissed(view.swapNumber);
  const unlockPrompt = unlockPromptState({
    restricted: view.restricted,
    provider: view.provider,
    dismissed: unlockDismissed,
  });
  const handleUnlock = async (destAddress: string): Promise<void> => {
    setUnlockSession({ flowId, attempted: true, reopened: unlockReopened });
    await actions.unlock(flowId, destAddress);
  };
  const handleUnlockSkip = (): void => {
    if (view.swapNumber !== null) markUnlockDismissed(view.swapNumber);
    setUnlockSession({ flowId, attempted: false, reopened: false });
    setUnlockDismissTick((t) => t + 1);
  };

  // Foreign-browser detection for atomic swaps.
  //
  //   provider === "atomicswap"  — the swap IS an atomic swap (server says so)
  //   kind === "swap"            — engine.resume couldn't find the keystore
  //                                in this browser's IDB and fell back to
  //                                SwapFlow (server-driven, view-only path)
  //   !isTerminal                — there's still drive work to do; once the
  //                                swap is terminal there's nothing to import
  //                                a keystore *for*
  //
  // Combined: the user is on a different browser than the one that started
  // this swap. Offer to import the keystore (drive locally) or continue
  // view-only. The dismissal is persisted per swapNumber so the modal
  // doesn't re-pop on every refresh.
  const showImportPrompt =
    view.provider === "atomicswap" &&
    view.kind === "swap" &&
    !isTerminal &&
    view.swapNumber !== null &&
    !isImportDismissed(view.swapNumber);

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Limited-view unlock prompt — rendered in its own row above the main
          grid (center column) so the grid's three columns always top-align
          with the swap card whether this prompt is shown or hidden. */}
      {(unlockPrompt.showCard || unlockPrompt.showReopenButton) && (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,480px)_320px] lg:gap-8">
          <div className="mx-auto w-full max-w-[480px] lg:col-start-2">
            {unlockPrompt.showCard && (
              <UnlockCard
                onUnlock={handleUnlock}
                onSkip={handleUnlockSkip}
                mismatch={unlockAttempted && view.restricted}
              />
            )}
            {unlockPrompt.showReopenButton && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setUnlockSession({ flowId, attempted: false, reopened: true })}
                  className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-mid transition-colors hover:text-ink"
                >
                  Unlock full details
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,480px)_320px] lg:gap-8">
        {/* LEFT — backup + brand pillars (continuity with /swap) */}
        <aside className="order-3 flex flex-col gap-3 lg:order-1">
          <BackupCard
            kind={view.kind}
            provider={view.provider}
            keystoreId={view.keystoreId}
            serverSwapId={view.serverSwapId}
            phase={view.phase}
            onImportKeystore={
              view.provider === "atomicswap" && view.kind === "swap"
                ? () => setManualImportOpen(true)
                : undefined
            }
          />
          <HeadlinesCard />
        </aside>

        {/* CENTER — sand lantern status card */}
        <div className="order-1 mx-auto w-full max-w-[480px] lg:order-2">
          <article className="rounded-2xl border border-bg/15 bg-surface p-5 text-bg">
            <CardHeader
              phase={displayPhase}
              tone={tone}
              swapNumber={view.swapNumber}
              onCopy={handleCopy}
              copiedKey={copiedKey}
            />

            <div className="mt-4">
              <PairSummary
                fromToken={view.fromToken}
                toToken={view.toToken}
                depositAmount={view.depositAmount}
                expectedOut={
                  view.phase === "refunded" || view.phase === "expired"
                    ? view.expectedOut
                    : (view.actualOut ?? view.expectedOut)
                }
                amountInUsd={view.amountInUsd}
                expectedOutUsd={view.expectedOutUsd}
                provider={view.provider}
                muted={view.phase === "refunded" || view.phase === "expired"}
              />
            </div>

            {!isTerminal &&
              view.depositAddress &&
              (() => {
                const showThorchainGate =
                  view.provider === "thorchain" &&
                  view.depositAmount !== null &&
                  view.fromToken !== null;
                const ackedThorchain =
                  showThorchainGate &&
                  thorchainAck !== null &&
                  thorchainAck.flowId === flowId &&
                  thorchainAck.amount === view.depositAmount;
                const toggleThorchainAck = (): void => {
                  if (!showThorchainGate || view.depositAmount === null) return;
                  setThorchainAck((prev) =>
                    prev !== null && prev.flowId === flowId && prev.amount === view.depositAmount
                      ? null
                      : { flowId, amount: view.depositAmount as string },
                  );
                };

                const showAtomicGate = view.provider === "atomicswap";
                // Identifiers under which this swap's ack is/can be persisted.
                // keystoreId is stable across the URL upgrade; swapNumber is the
                // canonical id post-upgrade. Either one matching counts as acked.
                const ackKeys = [view.keystoreId, view.swapNumber];
                // `atomicBetaAckTick` is read so React re-evaluates `ackedAtomic`
                // every time the user toggles. Without this, calling
                // markAtomicBetaAcked wouldn't trigger a re-render.
                void atomicBetaAckTick;
                const ackedAtomic = showAtomicGate && isAtomicBetaAcked(ackKeys);
                const toggleAtomicAck = (): void => {
                  if (!showAtomicGate) return;
                  if (ackedAtomic) {
                    unmarkAtomicBetaAcked(ackKeys);
                  } else {
                    markAtomicBetaAcked(ackKeys);
                  }
                  setAtomicBetaAckTick((t) => t + 1);
                };

                // Either gate that's active and unacked blurs the deposit. In
                // practice only one gate fires per swap (provider is either
                // thorchain or atomicswap, never both), but the OR keeps the
                // condition extensible if a future provider grows its own gate.
                const blurDeposit =
                  (showThorchainGate && !ackedThorchain) || (showAtomicGate && !ackedAtomic);

                return (
                  <>
                    {showThorchainGate && view.depositAmount && view.fromToken && (
                      <div className="mt-3">
                        <ThorchainAmountWarning
                          depositAmount={view.depositAmount}
                          fromToken={view.fromToken}
                          acked={ackedThorchain}
                          onToggleAck={toggleThorchainAck}
                        />
                      </div>
                    )}
                    {showAtomicGate && (
                      <div className="mt-3">
                        <AtomicBetaWarning acked={ackedAtomic} onToggleAck={toggleAtomicAck} />
                      </div>
                    )}
                    <div
                      className={`mt-3 transition-[filter,opacity] duration-200 ${
                        blurDeposit
                          ? "pointer-events-none select-none [filter:blur(8px)] opacity-70"
                          : ""
                      }`}
                      aria-hidden={blurDeposit}
                    >
                      <DepositTwoUp
                        depositAddress={view.depositAddress as string}
                        depositAmount={view.depositAmount}
                        fromToken={view.fromToken}
                        amountInUsd={view.amountInUsd}
                        timeLeftMs={timeLeftMs}
                        onCopy={handleCopy}
                        copiedKey={copiedKey}
                      />
                    </div>
                  </>
                );
              })()}

            {isTerminal && (
              <div className="mt-3">
                <ReceiptTwoUp
                  tone={tone}
                  phase={view.phase}
                  provider={view.provider}
                  actualOut={
                    view.phase === "refunded"
                      ? (view.actualOut ?? view.depositAmount)
                      : (view.actualOut ?? view.expectedOut)
                  }
                  toToken={view.toToken}
                  fromToken={view.fromToken}
                  outputTxHash={view.outputTxHash}
                  refundTxid={view.refundTxid}
                  depositAmount={view.depositAmount}
                  durationSec={view.durationSec}
                  destAddress={view.destAddress}
                  refundAddress={view.refundAddress}
                  errorMessage={view.errorMessage}
                  onCopy={handleCopy}
                  copiedKey={copiedKey}
                  keystoreId={view.keystoreId}
                  serverSwapId={view.serverSwapId}
                  swapNumber={view.swapNumber}
                />
              </div>
            )}

            {!isTerminal && !view.depositAddress && view.phase === "verification-failed" && (
              <div className="mt-3">
                <VerificationFailedCard view={view} flowId={flowId} />
              </div>
            )}

            {!isTerminal && !view.depositAddress && view.phase !== "verification-failed" && (
              <div className="mt-3">
                <PendingPanel message={view.statusMessage} phase={displayPhase} />
              </div>
            )}

            <div className="mt-4">
              <Pipeline stage={stage} isCancelFlow={isCancelFlow} tone={tone} />
            </div>

            {/* The verification-failed card already renders its own message
              + actions; suppress the generic status banner there to avoid
              duplicate copy. */}
            {!isTerminal && view.statusMessage && view.phase !== "verification-failed" && (
              <div className="mt-4 rounded-[10px] border border-bg/15 bg-bg/[0.04] px-3 py-2.5">
                <p className="font-mono text-[10.5px] leading-[1.55] text-bg/70">
                  {view.statusMessage}
                </p>
              </div>
            )}
          </article>

          <div className="mt-3 flex items-center justify-center">
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-mid transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3 w-3 transition-transform duration-150 group-hover:-translate-x-0.5" />
              Back to swap
            </Link>
          </div>
        </div>

        {/* RIGHT — verification */}
        <aside className="order-2 flex flex-col gap-3 lg:order-3">
          <VerificationCard
            verification={view.verification}
            provider={view.provider}
            sourceUrl={view.verificationSourceUrl}
            isActive={!isTerminal}
          />
          {shouldShowReviewLinks(view.phase) && <ReviewLinksCard />}
        </aside>

        {((showImportPrompt && importPromptOpen) || manualImportOpen) && view.swapNumber && (
          <KeystoreImportModal
            swapNumber={view.swapNumber}
            onClose={() => {
              setImportPromptOpen(false);
              setManualImportOpen(false);
            }}
            onImported={() => {
              // After import, the engine's existing SwapFlow path is bound;
              // the simplest reliable way to pick up the new keystore and
              // switch to AtomicFlow is a full reload — engine.resume re-runs
              // listKeystores, finds the import, and dispatches AtomicFlow.
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
