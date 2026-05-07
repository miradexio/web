import type { RequiredAction } from "@miradexio/client";

type PrimaryActionButtonProps = {
  readonly action: RequiredAction;
  readonly disabled: boolean;
  readonly onClick: () => void;
};

function actionLabel(type: RequiredAction["type"]): string {
  switch (type) {
    case "cancel":
      return "Cancel swap";
    case "refund":
      return "Claim refund";
    case "sweep":
      return "Retry sweep";
    default:
      return "Confirm";
  }
}

export function PrimaryActionButton({ action, disabled, onClick }: PrimaryActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[10px] bg-accent p-[14px] text-[14px] font-semibold text-bg transition-colors duration-150 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
    >
      {actionLabel(action.type)}
    </button>
  );
}
