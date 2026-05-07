"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import type { Token } from "../types";
import { loadFavorites, saveFavorites, tokenKey } from "./favorites";
import { Sidebar } from "./sidebar";
import { TokenList } from "./token-list";
import type { Category, TokenPickerModalProps } from "./types";

function matchesSearch(token: Token, q: string): boolean {
  return (
    token.coin.toLowerCase().includes(q) ||
    token.name.toLowerCase().includes(q) ||
    token.network.toLowerCase().includes(q)
  );
}

export function TokenPickerModal({
  open,
  onClose,
  onSelect,
  tokens,
  excludeToken,
}: TokenPickerModalProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [favorites, setFavoritesState] = useState<ReadonlySet<string>>(() => loadFavorites());

  useEffect(() => {
    if (!open) {
      setSearch("");
      setCategory("all");
      setSelectedChain(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const chains = useMemo(
    () => Array.from(new Set(tokens.map((t) => t.network))).sort(),
    [tokens],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tokens.filter((t) => {
      if (excludeToken && t.coin === excludeToken.coin && t.network === excludeToken.network) {
        return false;
      }
      if (selectedChain && t.network !== selectedChain) return false;
      if (category === "favorites" && !favorites.has(tokenKey(t))) return false;
      if (q.length > 0 && !matchesSearch(t, q)) return false;
      return true;
    });
  }, [tokens, search, excludeToken, selectedChain, category, favorites]);

  const toggleFavorite = (token: Token): void => {
    const key = tokenKey(token);
    const next = new Set(favorites);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setFavoritesState(next);
    saveFavorites(next);
  };

  const handleSelect = (token: Token): void => {
    onSelect(token);
    onClose();
  };

  const handleSelectCategory = (c: Category): void => {
    setCategory(c);
    setSelectedChain(null);
  };

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-bg md:h-[544px] md:max-h-[90vh] md:max-w-[688px] md:rounded-2xl md:border md:border-line-2 md:shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <Sidebar
          category={category}
          selectedChain={selectedChain}
          chains={chains}
          onSelectCategory={handleSelectCategory}
          onSelectChain={setSelectedChain}
        />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between p-6 pb-3">
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Select token</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-ink-mid transition-colors hover:bg-bg-2/50 hover:text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search any token. Example BTC"
                autoFocus
                className="w-full rounded-lg border border-line-2 bg-bg-2/40 py-3 pl-10 pr-4 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-dim focus:border-accent/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <TokenList
              tokens={filtered}
              favorites={favorites}
              category={category}
              onSelect={handleSelect}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
