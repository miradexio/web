import { useState } from "react";
import { X } from "lucide-react";
import { SLIPPAGE_PRESETS } from "./constants";

type SettingsPopoverProps = {
  readonly slippage: number;
  readonly onChange: (s: number) => void;
  readonly onClose: () => void;
};

const MIN_SLIPPAGE = 0.01;
const MAX_SLIPPAGE = 50;

export function SettingsPopover({ slippage, onChange, onClose }: SettingsPopoverProps) {
  const isPreset = SLIPPAGE_PRESETS.includes(slippage);
  const [customValue, setCustomValue] = useState(isPreset ? "" : String(slippage));

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-9 z-40 w-[260px] rounded-xl border border-bg/15 bg-surface p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[14px] font-semibold text-bg">Swap settings</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-bg/55 transition-colors hover:bg-bg/10 hover:text-bg"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-bg/70">
              Slippage tolerance
            </p>
            <span className="font-mono text-[12px] font-semibold text-bg">{slippage}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {SLIPPAGE_PRESETS.map((s) => {
              const active = s === slippage;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setCustomValue("");
                  }}
                  className={
                    active
                      ? "rounded-md border border-bg bg-bg px-2 py-1.5 font-mono text-[11px] font-semibold text-surface"
                      : "rounded-md border border-bg/20 bg-[#E5D5BE] px-2 py-1.5 font-mono text-[11px] font-medium text-bg transition-colors hover:bg-[#F0E0C8]"
                  }
                >
                  {s}%
                </button>
              );
            })}
          </div>
          <input
            type="number"
            value={customValue}
            placeholder="Custom %"
            min={MIN_SLIPPAGE}
            max={MAX_SLIPPAGE}
            step="0.1"
            onChange={(e) => {
              const v = e.target.value;
              setCustomValue(v);
              const parsed = parseFloat(v);
              if (!Number.isNaN(parsed) && parsed > 0 && parsed <= MAX_SLIPPAGE) {
                onChange(parsed);
              }
            }}
            className="mt-2 w-full rounded-md border border-bg/20 bg-[#E5D5BE] px-2.5 py-1.5 font-mono text-[12px] text-bg outline-none transition-colors placeholder:text-bg/40 focus:border-bg/40"
          />
          <p className="mt-2 font-mono text-[10px] leading-[1.5] text-bg/55">
            Maximum price movement allowed before the swap aborts.
          </p>
        </div>
      </div>
    </>
  );
}
