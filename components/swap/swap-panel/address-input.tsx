type AddressInputProps = {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error: string;
};

export function AddressInput({ label, placeholder, value, onChange, error }: AddressInputProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-bg/15 bg-[#D8C8A2] p-3.5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg">
        {label}
      </div>
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
      {error && (
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B41E28]">
          {error}
        </div>
      )}
    </div>
  );
}
