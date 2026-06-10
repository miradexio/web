type RefundToDestinationToggleProps = {
  readonly checked: boolean;
  readonly coin: string;
  readonly onChange: (checked: boolean) => void;
};

export function RefundToDestinationToggle({
  checked,
  coin,
  onChange,
}: RefundToDestinationToggleProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-bg/15 bg-[#D8C8A2] p-3.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[1px] h-3.5 w-3.5 shrink-0 cursor-pointer accent-bg"
      />
      <span className="flex flex-col gap-1">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg">
          Refund to destination address
        </span>
        {/* <span className="font-mono text-[10.5px] leading-relaxed text-bg/60">
          If the swap fails, your {coin} is returned to your destination address.
        </span> */}
      </span>
    </label>
  );
}
