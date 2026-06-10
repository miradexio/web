"use client";

import { Loader2, Settings2 } from "lucide-react";
import { TokenPickerModal } from "../../web-components/token-picker-modal";
import { FlipButton, SwapRow, formatNumber } from "../../web-components/swap-shared";
import { AddressInput } from "./address-input";
import { EmptyRoutes } from "./empty-routes";
import { HeadlinesCard } from "./headlines-card";
import { OtherRoutesList } from "./other-routes-list";
import { RecentSwapsCard } from "./recent-swaps-card";
import { RefundToDestinationToggle } from "./refund-to-destination-toggle";
import { RoutesHeader } from "./routes-header";
import { SelectedRouteCard } from "./selected-route-card";
import { SettingsPopover } from "./settings-popover";
import { SwapModeComparison } from "./swap-mode-comparison";
import { TrustpilotCard } from "./trustpilot-card";
import { SWAP_FORM_QUOTE_ID, useSwapForm } from "./use-swap-form";

export function SwapPanel() {
  const form = useSwapForm();

  return (
    <>
      <div
        className={
          form.enabled
            ? "grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[320px_minmax(0,480px)_320px] lg:gap-8"
            : "grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[320px_minmax(0,480px)] lg:justify-center lg:gap-8"
        }
      >
        <aside className="order-3 mx-auto flex w-full max-w-[480px] flex-col gap-4 lg:order-1 lg:mx-0 lg:max-w-none lg:gap-3">
          <HeadlinesCard />
          <RecentSwapsCard />
          <TrustpilotCard />
        </aside>
        <div className="order-1 mx-auto w-full max-w-[480px] lg:order-2">
          <div className="relative rounded-2xl border border-bg/15 bg-surface p-5 text-bg">
            <header className="relative flex items-center justify-between px-1 pb-4">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-bg">
                Swap
              </span>
              <button
                type="button"
                onClick={() => form.setShowSettings((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg/15 bg-bg/5 text-bg transition-colors hover:bg-bg/10"
                aria-label="Swap settings"
                aria-expanded={form.showSettings}
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>
              {form.showSettings && (
                <SettingsPopover
                  slippage={form.slippage}
                  onChange={form.setSlippage}
                  onClose={() => form.setShowSettings(false)}
                />
              )}
            </header>

            <div className="flex flex-col gap-1.5">
              <SwapRow
                label="From"
                token={form.from}
                amount={form.amount}
                onAmountChange={(v) => {
                  form.setAmount(v);
                  form.setSelectedQuoteId(undefined);
                }}
                usd={form.activeQuote?.fromAmountUsd}
                onPickToken={() => form.setPickerTarget("from")}
              />

              <FlipButton onClick={form.handleFlip} />

              <SwapRow
                label="To"
                token={form.to}
                amount={form.activeQuote ? form.activeQuote.toAmount : ""}
                readOnly
                usd={form.activeQuote?.toAmountUsd}
                loading={form.isLoading && form.enabled && !form.activeQuote}
                onPickToken={() => form.setPickerTarget("to")}
              />
            </div>

            {form.activeQuote && form.from && form.to && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] border border-[#1F6B3A]/50 bg-[#1F6B3A]/[0.10] px-3.5 py-3">
                <span className="flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#1F6B3A]">
                  <span className="ns-twinkle inline-block h-1.5 w-1.5 rounded-full bg-[#1F6B3A]" />
                  Live rate
                </span>
                <span className="font-mono text-[12px] font-semibold text-[#1F6B3A]">
                  1 {form.from.coin} = {formatNumber(form.activeQuote.rate, 6)} {form.to.coin}
                </span>
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              <AddressInput
                label="Destination"
                placeholder={`Where to send your  ${form.to?.coin ?? ""}`}
                value={form.destAddr}
                onChange={form.setDestAddr}
                error={form.destError}
              />
              {form.refundPolicy.showRefundToDestinationToggle && (
                <RefundToDestinationToggle
                  checked={form.refundToDestination}
                  coin={form.from?.coin ?? ""}
                  onChange={form.setRefundToDestination}
                />
              )}
              {form.refundPolicy.showRefundField && (
                <AddressInput
                  label="Refund"
                  placeholder={`If the swap fails — Your ${form.from?.coin ?? ""} is Auto refunded.`}
                  value={form.refundAddr}
                  onChange={form.setRefundAddr}
                  error={form.refundError}
                  // helperText={`Only used if the swap fails — your ${form.from?.coin ?? ""} is returned here.`}
                />
              )}
            </div>

            <button
              type="button"
              onClick={form.handleSubmit}
              disabled={!form.canSwap}
              className="mt-3 w-full rounded-[10px] bg-accent p-[14px] text-[14px] font-semibold text-bg transition-colors duration-150 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent"
            >
              {form.isSubmitting ? "Starting swap…" : "Swap"}
            </button>

            {form.isSubmitting && (
              <div className="mt-2.5 flex items-center gap-2 rounded-[10px] border border-bg/15 bg-bg/[0.06] px-3 py-2">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-bg/65" />
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-bg/75">
                  Preparing your swap…
                </span>
              </div>
            )}

            {form.submitError && (
              <p className="mt-2 px-1 font-mono text-[10px] font-semibold text-[#B41E28]">
                {form.submitError.message}
              </p>
            )}
          </div>
        </div>
        {form.enabled && (
          <aside className="order-2 flex flex-col gap-3 lg:order-3">
            <RoutesHeader
              count={form.sortedQuotes.length}
              lastUpdated={form.lastUpdated}
              sortMode={form.sortMode}
              protocolFilter={form.protocolFilter}
              onSortChange={form.setSortMode}
              onProtocolChange={form.setProtocolFilter}
              showSort={form.showSort}
              onToggleSort={() => form.setShowSort((v) => !v)}
              onCloseSort={() => form.setShowSort(false)}
            />

            {form.sortedQuotes.length === 0 ? (
              <EmptyRoutes
                isLoading={form.isLoading}
                protocolFilter={form.protocolFilter}
                onResetFilter={() => form.setProtocolFilter("all")}
              />
            ) : form.activeQuote && form.activeProvider ? (
              <>
                <SelectedRouteCard
                  quote={form.activeQuote}
                  toCoin={form.to?.coin ?? ""}
                  tags={form.quoteTags.get(SWAP_FORM_QUOTE_ID(form.activeQuote)) ?? new Set()}
                />

                {form.activeProvider.variants.length > 1 && (
                  <SwapModeComparison
                    providerName={form.activeProvider.name}
                    variants={form.activeProvider.variants}
                    selectedQuoteId={form.selectedQuoteId}
                    onSelect={form.setSelectedQuoteId}
                    toCoin={form.to?.coin ?? ""}
                  />
                )}

                {form.otherProviders.length > 0 && (
                  <OtherRoutesList
                    providers={form.otherProviders}
                    toCoin={form.to?.coin ?? ""}
                    onSelect={form.setSelectedQuoteId}
                  />
                )}
              </>
            ) : null}
          </aside>
        )}
      </div>

      <TokenPickerModal
        open={form.pickerTarget !== null}
        onClose={() => form.setPickerTarget(null)}
        onSelect={form.handleTokenSelect}
        tokens={form.tokens}
        excludeToken={form.pickerTarget === "from" ? form.to : form.from}
      />
    </>
  );
}
