type RefundToDestinationToggleProps = {
  readonly checked: boolean;
  readonly address: string;
  readonly onChange: (checked: boolean) => void;
};

export function RefundToDestinationToggle({
  checked,
  address,
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
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg">
          Refund to your EVM address
        </span>
        {checked && (
          <span className="break-all font-mono text-[10.5px] font-medium text-bg/65">
            {address}
          </span>
        )}
      </span>
    </label>
  );
}
