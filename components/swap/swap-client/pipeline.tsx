import {
  PIPELINE_LABELS,
  PIPELINE_LABELS_CANCEL,
  PIPELINE_LABELS_EXPIRED,
  PIPELINE_LABELS_REFUND,
} from "./view";
import type { PipelineStage } from "./view";
import type { Tone } from "./types";

type PipelineProps = {
  readonly stage: PipelineStage | null;
  readonly isCancelFlow: boolean;
  readonly tone: Tone;
};

// Number of stages that are unambiguously "done" before the warn region
// starts. For refund, deposit was confirmed on-chain so first three are
// green. For expiry, only swap creation happened so only the first is
// green and everything else is warn.
const REFUND_GREEN_COUNT = 3;
const EXPIRED_GREEN_COUNT = 1;

const COLOR_DONE_GREEN = "#1F6B3A";
const COLOR_WARN_ORANGE = "#C2611B";
const COLOR_ERROR_RED = "#B41E28";

export function Pipeline({ stage, isCancelFlow, tone }: PipelineProps) {
  const isRefundFlow = stage === "refunded";
  const isExpiredFlow = stage === "expired";
  const isWarnTerminal = isRefundFlow || isExpiredFlow;
  const labels = isExpiredFlow
    ? PIPELINE_LABELS_EXPIRED
    : isRefundFlow
      ? PIPELINE_LABELS_REFUND
      : isCancelFlow
        ? PIPELINE_LABELS_CANCEL
        : PIPELINE_LABELS;
  const greenCount = isExpiredFlow
    ? EXPIRED_GREEN_COUNT
    : isRefundFlow
      ? REFUND_GREEN_COUNT
      : null;
  const isComplete = !isWarnTerminal && (tone === "success" || stage === "complete");
  const isFailed = tone === "fail";
  const currentIdx = stage === null ? -1 : labels.findIndex((l) => l.key === stage);

  return (
    <div>
      <div className="relative grid grid-cols-5 items-center">
        {labels.slice(0, -1).map((entry, i) => {
          const segGreen =
            greenCount !== null ? i < greenCount - 1 : isComplete || i < currentIdx;
          const segWarn = greenCount !== null && i >= greenCount - 1;
          let bg = "rgba(26, 31, 53, 0.18)";
          if (segGreen) bg = "rgba(31, 107, 58, 0.55)";
          else if (segWarn) bg = "rgba(194, 97, 27, 0.55)";
          return (
            <div
              key={`seg-${entry.key}`}
              aria-hidden
              className="absolute top-1/2 h-[2px] -translate-y-1/2"
              style={{
                left: `calc(${((i + 0.5) / labels.length) * 100}% + 8px)`,
                right: `calc(${(1 - (i + 1.5) / labels.length) * 100}% + 8px)`,
                background: bg,
                transition: "background 160ms ease",
              }}
            />
          );
        })}
        {labels.map((entry, i) => {
          const isWarnHere = greenCount !== null && i >= greenCount;
          const isDone = greenCount !== null ? i < greenCount : isComplete || i < currentIdx;
          const isCurrent = !isComplete && !isWarnTerminal && i === currentIdx;
          const isFailHere = isFailed && i === currentIdx;
          return (
            <div key={entry.key} className="z-10 flex justify-center">
              <PipelineDot
                isDone={isDone}
                isCurrent={isCurrent}
                isFail={isFailHere}
                isWarn={isWarnHere}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-5">
        {labels.map((entry, i) => {
          const isWarnHere = greenCount !== null && i >= greenCount;
          const isDone = greenCount !== null ? i < greenCount : isComplete || i < currentIdx;
          const isCurrent = !isComplete && !isWarnTerminal && i === currentIdx;
          const isFailHere = isFailed && i === currentIdx;
          let cls = "text-bg/40";
          if (isFailHere) cls = "text-[#B41E28]";
          else if (isWarnHere) cls = "text-[#C2611B]";
          else if (isCurrent) cls = "text-bg";
          else if (isDone) cls = "text-bg/70";
          const weight = isCurrent || isWarnHere ? "font-semibold" : "font-medium";
          return (
            <div
              key={`label-${entry.key}`}
              className={`text-center font-mono text-[9.5px] uppercase tracking-[0.14em] ${cls} ${weight}`}
            >
              {entry.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PipelineDotProps = {
  readonly isDone: boolean;
  readonly isCurrent: boolean;
  readonly isFail: boolean;
  readonly isWarn: boolean;
};

function PipelineDot({ isDone, isCurrent, isFail, isWarn }: PipelineDotProps) {
  if (isFail) {
    return (
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full font-mono text-[10px] font-bold leading-none text-surface"
        style={{ background: COLOR_ERROR_RED, borderColor: COLOR_ERROR_RED }}
      >
        ✗
      </span>
    );
  }
  if (isWarn) {
    return (
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full font-mono text-[10px] font-bold leading-none text-surface"
        style={{ background: COLOR_WARN_ORANGE, borderColor: COLOR_WARN_ORANGE }}
      >
        ↩
      </span>
    );
  }
  if (isDone) {
    return (
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full font-mono text-[10px] font-bold leading-none text-surface"
        style={{ background: COLOR_DONE_GREEN, borderColor: COLOR_DONE_GREEN }}
      >
        ✓
      </span>
    );
  }
  if (isCurrent) {
    return (
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full"
        style={{
          background: "var(--accent)",
          boxShadow: "0 0 0 4px rgba(232, 148, 90, 0.22)",
        }}
      >
        <span className="ns-twinkle inline-block h-1.5 w-1.5 rounded-full bg-bg" />
      </span>
    );
  }
  return (
    <span
      className="block h-4 w-4 rounded-full border-[1.5px]"
      style={{
        background: "rgba(26, 31, 53, 0.04)",
        borderColor: "rgba(26, 31, 53, 0.22)",
      }}
    />
  );
}
