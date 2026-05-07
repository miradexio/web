"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Quote, Token } from "../../web-components/types";
import { useTokens } from "@/hooks/use-tokens";
import { useQuote } from "@/hooks/use-quote";
import { useSwap } from "@/hooks/use-swap";
import { findToken } from "../../web-components/swap-shared";
import { readKeystore } from "@/lib/miradex-web/idb";
import { DEFAULT_SLIPPAGE } from "./constants";
import { validateAddress } from "./helpers";
import type { ProtocolFilter, ProviderGroup, RouteTag, SortMode } from "./types";

const DEFAULT_AMOUNT = "0.1";

export type PickerTarget = "from" | "to" | null;

export type SwapFormState = {
  readonly tokens: readonly Token[];
  readonly from: Token | null;
  readonly to: Token | null;
  readonly amount: string;
  readonly amountNum: number;
  readonly enabled: boolean;
  readonly destAddr: string;
  readonly refundAddr: string;
  readonly destError: string;
  readonly refundError: string;
  readonly slippage: number;
  readonly showSettings: boolean;
  readonly pickerTarget: PickerTarget;
  readonly sortMode: SortMode;
  readonly protocolFilter: ProtocolFilter;
  readonly showSort: boolean;
  readonly isLoading: boolean;
  readonly lastUpdated: number;
  readonly sortedQuotes: readonly Quote[];
  readonly providers: readonly ProviderGroup[];
  readonly activeProvider: ProviderGroup | undefined;
  readonly otherProviders: readonly ProviderGroup[];
  readonly selectedQuoteId: string | undefined;
  readonly activeQuote: Quote | null;
  readonly quoteTags: ReadonlyMap<string, ReadonlySet<RouteTag>>;
  readonly canSwap: boolean;
  readonly isSubmitting: boolean;
  readonly submitError: Error | null;
  readonly setAmount: (v: string) => void;
  readonly setDestAddr: (v: string) => void;
  readonly setRefundAddr: (v: string) => void;
  readonly setSlippage: (s: number) => void;
  readonly setShowSettings: (s: boolean | ((v: boolean) => boolean)) => void;
  readonly setPickerTarget: (t: PickerTarget) => void;
  readonly setSortMode: (m: SortMode) => void;
  readonly setProtocolFilter: (p: ProtocolFilter) => void;
  readonly setShowSort: (s: boolean | ((v: boolean) => boolean)) => void;
  readonly setSelectedQuoteId: (id: string | undefined) => void;
  readonly handleFlip: () => void;
  readonly handleTokenSelect: (token: Token) => void;
  readonly handleSubmit: () => void;
};

function quoteId(quote: Quote): string {
  return `${quote.provider}-${quote.variantId}`;
}

function sortQuotesByMode(quotes: readonly Quote[], mode: SortMode): readonly Quote[] {
  const arr = [...quotes];
  switch (mode) {
    case "fastest":
      return arr.sort(
        (a, b) =>
          (a.estimatedDurationSeconds ?? Infinity) - (b.estimatedDurationSeconds ?? Infinity),
      );
    case "best":
    case "default":
      return arr.sort((a, b) => parseFloat(b.toAmount) - parseFloat(a.toAmount));
  }
}

function groupByProvider(quotes: readonly Quote[]): readonly ProviderGroup[] {
  const grouped: Record<string, Quote[]> = {};
  for (const q of quotes) {
    if (!grouped[q.provider]) grouped[q.provider] = [];
    grouped[q.provider].push(q);
  }
  return Object.entries(grouped)
    .map(([name, variants]) => {
      const sortedVariants = [...variants].sort(
        (a, b) => parseFloat(b.toAmount) - parseFloat(a.toAmount),
      );
      return { name, best: sortedVariants[0], variants: sortedVariants };
    })
    .sort((a, b) => parseFloat(b.best.toAmount) - parseFloat(a.best.toAmount));
}

function buildSuperlativeTags(
  quotes: readonly Quote[],
): ReadonlyMap<string, ReadonlySet<RouteTag>> {
  const tags = new Map<string, ReadonlySet<RouteTag>>();
  if (quotes.length === 0) return tags;

  const set = (id: string, t: RouteTag): void => {
    const existing = new Set(tags.get(id) ?? []);
    existing.add(t);
    tags.set(id, existing);
  };

  const bestPrice = quotes[0];
  set(quoteId(bestPrice), "best");

  // Only tag "fastest" when there's an actual differentiator; when every
  // quote shares an ETA the tag is noise.
  const durations = quotes
    .map((q) => q.estimatedDurationSeconds)
    .filter((d): d is number => d !== undefined);
  const allSameDuration =
    durations.length === quotes.length &&
    durations.every((d) => d === durations[0]);
  if (durations.length > 0 && !allSameDuration) {
    const fastest = [...quotes].sort(
      (a, b) =>
        (a.estimatedDurationSeconds ?? Infinity) - (b.estimatedDurationSeconds ?? Infinity),
    )[0];
    if (fastest && fastest.estimatedDurationSeconds !== undefined) {
      set(quoteId(fastest), "fastest");
    }
  }

  return tags;
}

export function useSwapForm(): SwapFormState {
  const { data: tokens = [] } = useTokens();
  const swapMutation = useSwap();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const fromChainParam = searchParams.get("fromChain");
  const toParam = searchParams.get("to");
  const toChainParam = searchParams.get("toChain");
  const amountParam = searchParams.get("amount");
  // Verification-failed restart (chainflip/thorchain/near_intents): URL
  // carries dest + refund verbatim so the user doesn't retype. Atomicswap
  // uses ?reuseKeystore= below because it also has to bind a BTC funding key.
  const destAddressParam = searchParams.get("destAddress")?.trim() ?? null;
  const refundAddressParam = searchParams.get("refundAddress")?.trim() ?? null;
  // Restart-after-failure for atomic: bind the new swap to the existing
  // keystore (same key + funding address) so a still-funded BTC address
  // doesn't force a fresh deposit. UUID matches KeystoreRow.id.
  const reuseKeystoreParam = searchParams.get("reuseKeystore")?.trim() ?? null;
  const reuseKeystoreId =
    reuseKeystoreParam !== null && reuseKeystoreParam.length > 0 ? reuseKeystoreParam : null;

  const [from, setFrom] = useState<Token | null>(null);
  const [to, setTo] = useState<Token | null>(null);
  const [amount, setAmount] = useState(amountParam ?? DEFAULT_AMOUNT);
  const [destAddr, setDestAddr] = useState("");
  const [refundAddr, setRefundAddr] = useState("");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | undefined>();
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("all");
  const [showSort, setShowSort] = useState(false);

  // URL params first, BTC -> ETH defaults otherwise.
  useEffect(() => {
    if (tokens.length === 0) return;

    if (fromParam) {
      const matched = findToken(tokens, fromParam, fromChainParam);
      if (matched) setFrom(matched);
    } else if (!from) {
      setFrom(tokens.find((t) => t.coin === "BTC") ?? tokens[0] ?? null);
    }

    if (toParam) {
      const matched = findToken(tokens, toParam, toChainParam);
      if (matched) setTo(matched);
    } else if (!to) {
      setTo(tokens.find((t) => t.coin === "ETH") ?? tokens[1] ?? tokens[0] ?? null);
    }

    if (amountParam) {
      setAmount(amountParam);
      setSelectedQuoteId(undefined);
    }
    // from/to are intentionally not in the dep array — they're guards, not triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, fromParam, toParam, fromChainParam, toChainParam, amountParam]);

  // ?reuseKeystore=<UUID>: load keystore + pre-fill dest/refund from the
  // original swap. SDK trusts the form submission (no re-derivation from
  // the keystore), so this is the only way to spare retyping. Editable.
  useEffect(() => {
    if (!reuseKeystoreId) return;
    let cancelled = false;
    readKeystore(reuseKeystoreId)
      .then((ks) => {
        if (cancelled) return;
        setDestAddr((current) => current || ks.swap.receiveAddress);
        setRefundAddr((current) => current || ks.swap.refundAddress);
      })
      .catch(() => {
        // Missing/unreadable keystore: leave inputs empty, fall back to
        // manual entry. Submit-time validator catches any real mistake.
      });
    return () => {
      cancelled = true;
    };
  }, [reuseKeystoreId]);

  // Pre-fill from URL only when the input is still empty (don't clobber
  // a mid-edit value).
  useEffect(() => {
    if (destAddressParam !== null && destAddressParam.length > 0) {
      setDestAddr((current) => current || destAddressParam);
    }
    if (refundAddressParam !== null && refundAddressParam.length > 0) {
      setRefundAddr((current) => current || refundAddressParam);
    }
  }, [destAddressParam, refundAddressParam]);

  const amountNum = parseFloat(amount) || 0;
  const enabled = !!from && !!to && amountNum > 0;

  const { data: quotes = [], isLoading, lastUpdated } = useQuote({
    fromCoin: from?.coin ?? "",
    fromNetwork: from?.network ?? "",
    toCoin: to?.coin ?? "",
    toNetwork: to?.network ?? "",
    amount: amountNum,
    enabled,
  });

  const filteredQuotes = useMemo(() => {
    if (protocolFilter === "all") return quotes;
    return quotes.filter((q) => q.provider.toLowerCase() === protocolFilter);
  }, [quotes, protocolFilter]);

  const sortedQuotes = useMemo(
    () => sortQuotesByMode(filteredQuotes, sortMode),
    [filteredQuotes, sortMode],
  );

  const providers = useMemo(() => groupByProvider(sortedQuotes), [sortedQuotes]);

  const activeProvider = useMemo(
    () =>
      providers.find((p) => p.variants.some((v) => quoteId(v) === selectedQuoteId)) ??
      providers[0],
    [providers, selectedQuoteId],
  );
  const otherProviders = useMemo(
    () => providers.filter((p) => p.name !== activeProvider?.name),
    [providers, activeProvider],
  );

  const quoteTags = useMemo(() => buildSuperlativeTags(sortedQuotes), [sortedQuotes]);

  useEffect(() => {
    if (sortedQuotes.length > 0 && !selectedQuoteId) {
      setSelectedQuoteId(quoteId(sortedQuotes[0]));
    } else if (sortedQuotes.length === 0 && selectedQuoteId) {
      setSelectedQuoteId(undefined);
    }
  }, [sortedQuotes, selectedQuoteId]);

  const activeQuote: Quote | null = useMemo(() => {
    if (sortedQuotes.length === 0) return null;
    const found = quotes.find((q) => quoteId(q) === selectedQuoteId);
    return found ?? sortedQuotes[0];
  }, [quotes, selectedQuoteId, sortedQuotes]);

  const destError = validateAddress(destAddr, to);
  const refundError = validateAddress(refundAddr, from);

  const canSwap =
    !!from &&
    !!to &&
    !!activeQuote &&
    destAddr.length > 0 &&
    !destError &&
    refundAddr.length > 0 &&
    !refundError &&
    amountNum > 0 &&
    !swapMutation.isPending;

  const handleFlip = useCallback(() => {
    setFrom(to);
    setTo(from);
    setSelectedQuoteId(undefined);
  }, [from, to]);

  const handleTokenSelect = useCallback(
    (token: Token) => {
      if (pickerTarget === "from") {
        if (to && token.coin === to.coin && token.network === to.network) {
          setTo(from);
        }
        setFrom(token);
      } else {
        if (from && token.coin === from.coin && token.network === from.network) {
          setFrom(to);
        }
        setTo(token);
      }
      setSelectedQuoteId(undefined);
      setPickerTarget(null);
    },
    [pickerTarget, from, to],
  );

  const handleSubmit = useCallback(() => {
    if (!canSwap || !activeQuote || !from || !to) return;
    swapMutation.mutate({
      fromCoin: from.coin,
      fromNetwork: from.network,
      toCoin: to.coin,
      toNetwork: to.network,
      amount: amountNum,
      toAddress: destAddr,
      fromAddress: refundAddr,
      slippage,
      selectedQuote: activeQuote,
      // Only honored by the SDK on atomic pairs. Null/absent = generate a
      // fresh keystore (default flow); set = bind new swap to the existing
      // keystore (restart-after-failure flow).
      existingKeystoreId: reuseKeystoreId ?? undefined,
    });
  }, [
    canSwap,
    activeQuote,
    from,
    to,
    amountNum,
    destAddr,
    refundAddr,
    slippage,
    swapMutation,
    reuseKeystoreId,
  ]);

  return {
    tokens,
    from,
    to,
    amount,
    amountNum,
    enabled,
    destAddr,
    refundAddr,
    destError,
    refundError,
    slippage,
    showSettings,
    pickerTarget,
    sortMode,
    protocolFilter,
    showSort,
    isLoading,
    lastUpdated,
    sortedQuotes,
    providers,
    activeProvider,
    otherProviders,
    selectedQuoteId,
    activeQuote,
    quoteTags,
    canSwap,
    isSubmitting: swapMutation.isPending,
    submitError: swapMutation.error,
    setAmount,
    setDestAddr,
    setRefundAddr,
    setSlippage,
    setShowSettings,
    setPickerTarget,
    setSortMode,
    setProtocolFilter,
    setShowSort,
    setSelectedQuoteId,
    handleFlip,
    handleTokenSelect,
    handleSubmit,
  };
}

export const SWAP_FORM_QUOTE_ID = quoteId;
