import type { EngineState } from "@miradexio/client";
import {
  PIPELINE_LABELS,
  PIPELINE_LABELS_CANCEL,
  PIPELINE_LABELS_REFUND,
  PIPELINE_LABELS_EXPIRED,
  atomicPipelineStage,
  swapPipelineStage,
} from "@miradexio/client/portable";
import type { PipelineStage } from "@miradexio/client/portable";
import { FAIL_PHASES, SUCCESS_PHASES, WARN_PHASES } from "./constants";
import type { FlowKind, FlowView, Tone } from "./types";

export function viewFromState(state: EngineState | null): FlowView | null {
  if (state === null) return null;
  const kind: FlowKind = state.activeFlow === "atomic" ? "atomic" : "swap";
  const flow = kind === "atomic" ? state.atomic : state.swap;
  if (flow.phase === "idle") return null;

  const snapshot = "snapshot" in flow ? flow.snapshot : null;
  const requiredAction =
    "requiredAction" in flow && flow.requiredAction !== undefined ? flow.requiredAction : null;
  const errorMessage = flow.phase === "failed" ? flow.error : null;
  const statusMessage = "message" in flow ? flow.message : snapshot?.extra?.text ?? null;
  const outputTxHash = "outputTxHash" in flow ? flow.outputTxHash : null;
  const refundTxid = "refundTxid" in flow ? flow.refundTxid : null;
  const actualOut = "actualOut" in flow ? flow.actualOut : null;
  const durationSec = "durationSec" in flow ? flow.durationSec : null;

  return {
    kind,
    phase: flow.phase,
    fromToken: snapshot?.fromToken ?? null,
    toToken: snapshot?.toToken ?? null,
    depositAddress: snapshot?.depositAddr ?? null,
    depositAmount: snapshot?.depositAmount ?? null,
    expectedOut: snapshot?.expectedOut ?? null,
    destAddress: snapshot?.destAddress ?? null,
    refundAddress: snapshot?.refundAddress ?? null,
    amountInUsd: snapshot?.amountInUsd ?? null,
    expectedOutUsd: snapshot?.expectedOutUsd ?? null,
    provider: snapshot?.provider ?? null,
    verification: snapshot?.verification ?? null,
    verificationSourceUrl: snapshot?.verificationSourceUrl ?? null,
    expiresAt: snapshot?.expiresAt ?? null,
    requiredAction,
    errorMessage,
    statusMessage,
    outputTxHash,
    refundTxid,
    actualOut,
    durationSec,
    swapNumber: snapshot?.swapNumber ?? null,
    keystoreId: snapshot?.keystoreId ?? null,
    serverSwapId:
      state.atomic.snapshot?.swapId ?? state.swap.snapshot?.swapId ?? null,
  };
}

export function pipelineStageOf(view: FlowView): PipelineStage | null {
  return view.kind === "atomic"
    ? atomicPipelineStage(view.phase as never)
    : swapPipelineStage(view.phase as never);
}

export function phaseTone(phase: string): Tone {
  if (FAIL_PHASES.has(phase)) return "fail";
  if (WARN_PHASES.has(phase)) return "warn";
  if (SUCCESS_PHASES.has(phase)) return "success";
  return "progress";
}

export {
  PIPELINE_LABELS,
  PIPELINE_LABELS_CANCEL,
  PIPELINE_LABELS_REFUND,
  PIPELINE_LABELS_EXPIRED,
};
export type { PipelineStage };
