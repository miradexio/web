import type { Token } from "../types";
import { tokenKey } from "./favorites";
import { TokenRow } from "./token-row";
import type { Category } from "./types";

type TokenListProps = {
  readonly tokens: readonly Token[];
  readonly favorites: ReadonlySet<string>;
  readonly category: Category;
  readonly onSelect: (token: Token) => void;
  readonly onToggleFavorite: (token: Token) => void;
};

export function TokenList({
  tokens,
  favorites,
  category,
  onSelect,
  onToggleFavorite,
}: TokenListProps) {
  if (tokens.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-dim">
          {category === "favorites" ? "No favorites yet" : "No tokens found"}
        </p>
        {category === "favorites" && (
          <p className="mt-2 text-[12px] text-ink-mid">
            Tap the ♥ next to any token to save it here.
          </p>
        )}
      </div>
    );
  }
  return (
    <ul className="space-y-0.5">
      {tokens.map((token) => (
        <li key={`${token.coin}-${token.network}`}>
          <TokenRow
            token={token}
            isFavorite={favorites.has(tokenKey(token))}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        </li>
      ))}
    </ul>
  );
}
