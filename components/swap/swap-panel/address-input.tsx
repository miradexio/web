"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

type AddressInputProps = {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error: string;
  readonly helperText?: string;
};

function canReadClipboard(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.readText === "function";
}

export function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
}: AddressInputProps) {
  const [showPaste, setShowPaste] = useState(false);

  useEffect(() => {
    setShowPaste(canReadClipboard());
  }, []);

  const isValid = value.length > 0 && !error;

  const handlePaste = (): void => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text.trim()) onChange(text.trim());
      })
      .catch(() => {
        // Permission denied or empty clipboard — user can still type/paste manually.
      });
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-bg/15 bg-[#D8C8A2] p-3.5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg">
          {label}
        </div>
        {isValid && (
          <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1F6B3A]">
            <Check className="h-3 w-3" />
            Valid
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={placeholder}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full bg-transparent font-mono text-[13px] font-medium text-bg outline-none placeholder:text-bg/45"
        />
        {showPaste && value.length === 0 && (
          <button
            type="button"
            onClick={handlePaste}
            className="shrink-0 rounded-md border border-bg/25 bg-bg/[0.05] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-bg/70 transition-colors hover:bg-bg/[0.10] hover:text-bg"
          >
            Paste
          </button>
        )}
      </div>
      {error && (
        <div className="font-mono text-[10.5px] font-medium leading-relaxed text-[#B41E28]">
          {error}
        </div>
      )}
      {!error && helperText && (
        <div className="font-mono text-[10.5px] leading-relaxed text-bg/60">{helperText}</div>
      )}
    </div>
  );
}
