import { Clock, LayoutGrid, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChainIcon } from "./chain-icon";
import type { Category } from "./types";

type SidebarProps = {
  readonly category: Category;
  readonly selectedChain: string | null;
  readonly chains: readonly string[];
  readonly onSelectCategory: (c: Category) => void;
  readonly onSelectChain: (chain: string) => void;
};

type CategoryItem = {
  readonly id: Category;
  readonly icon: LucideIcon;
  readonly label: string;
};

const CATEGORIES: readonly CategoryItem[] = [
  { id: "all", icon: LayoutGrid, label: "All Assets" },
  { id: "favorites", icon: Star, label: "Favorites" },
  { id: "recents", icon: Clock, label: "Recents" },
];

const CHAIN_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  bsc: "BSC",
  bitcoincash: "Bitcoin Cash",
  xrp: "XRP",
  ton: "TON",
};

function chainDisplayName(chain: string): string {
  const mapped = CHAIN_DISPLAY_NAMES[chain.toLowerCase()];
  if (mapped) return mapped;
  return chain.charAt(0).toUpperCase() + chain.slice(1);
}

export function Sidebar({
  category,
  selectedChain,
  chains,
  onSelectCategory,
  onSelectChain,
}: SidebarProps) {
  return (
    <div className="flex w-full shrink-0 flex-col border-b border-line md:h-full md:w-[208px] md:border-b-0 md:border-r md:min-h-0">
      <div className="flex flex-row gap-1 overflow-x-auto px-4 py-3 no-scrollbar md:flex-col md:space-y-1 md:px-5 md:pt-6 md:overflow-visible">
        {CATEGORIES.map((item) => {
          const Icon = item.icon;
          const isActive = category === item.id && !selectedChain;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(item.id)}
              className={
                isActive
                  ? "flex shrink-0 items-center gap-2 rounded-lg bg-bg-2 px-3 py-2 text-[13px] font-medium text-ink md:w-full md:gap-3 md:py-2.5"
                  : "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-mid transition-colors hover:bg-bg-2/50 hover:text-ink md:w-full md:gap-3 md:py-2.5"
              }
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-accent" : "text-ink-dim"}`} />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col border-t border-line/5 md:mt-6 md:flex-1 md:border-0 md:px-5 md:pb-5 md:min-h-0">
        <h4 className="hidden px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim md:block md:px-3 md:py-0 md:mb-3">
          Chains
        </h4>
        <div className="flex flex-row gap-1 overflow-x-auto px-4 pb-3 no-scrollbar md:flex-1 md:flex-col md:space-y-0.5 md:px-0 md:pb-0 md:overflow-y-auto md:min-h-0">
          {chains.map((chain) => {
            const isActive = selectedChain === chain;
            return (
              <button
                key={chain}
                type="button"
                onClick={() => onSelectChain(chain)}
                className={
                  isActive
                    ? "flex shrink-0 items-center gap-2 rounded-lg bg-bg-2 px-3 py-2 text-[13px] font-medium text-ink md:w-full md:gap-3"
                    : "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-mid transition-colors hover:bg-bg-2/50 hover:text-ink md:w-full md:gap-3"
                }
              >
                <ChainIcon chain={chain} size={20} />
                <span className="whitespace-nowrap">{chainDisplayName(chain)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
