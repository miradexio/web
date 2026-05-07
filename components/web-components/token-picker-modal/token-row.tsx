import { Heart } from "lucide-react";
import type { Token } from "../types";
import { TokenWithChainBadge } from "./token-with-chain-badge";

type TokenRowProps = {
  readonly token: Token;
  readonly isFavorite: boolean;
  readonly onSelect: (token: Token) => void;
  readonly onToggleFavorite: (token: Token) => void;
};

export function TokenRow({ token, isFavorite, onSelect, onToggleFavorite }: TokenRowProps) {
  const priceNum = token.priceUsd ? parseFloat(token.priceUsd) : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(token)}
      className="flex w-full items-center justify-between gap-4 rounded-lg p-3 text-left transition-colors hover:bg-bg-2/50"
    >
      <div className="flex items-center gap-3">
        <TokenWithChainBadge token={token} />
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-ink">{token.coin}</div>
          <div className="text-[12px] capitalize text-ink-mid">{token.network}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          role="button"
          tabIndex={0}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(token);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(token);
            }
          }}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-bg-2"
        >
          <Heart
            className={
              isFavorite ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4 text-ink-dim"
            }
            strokeWidth={isFavorite ? 1.5 : 1.8}
          />
        </span>
        {priceNum > 0 && (
          <span className="font-mono text-[13px] text-ink">
            ${priceNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </button>
  );
}
