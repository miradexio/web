"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NightScene } from "../components/web-components/night-scene";
import { SiteFooter } from "@/components/site-footer";
import { SwapPanel } from "@/components/swap/swap-panel";

const SwapClient = dynamic(() => import("@/components/swap/swap-client"), {
  ssr: false,
});

function SwapBody(): React.JSX.Element {
  const params = useSearchParams();
  const id = params.get("id")?.trim();
  const keystore = params.get("keystore")?.trim();
  // ?keystore= is the transient atomic-flow URL before /swap/new returns;
  // ?id= is the canonical server-issued one. SwapClient handles validation.
  const hasFlow =
    (id && id.length > 0) || (keystore && keystore.length > 0);
  if (hasFlow) return <SwapClient />;
  return <SwapPanel />;
}

export default function SwapPage(): React.JSX.Element {
  return (
    <section className="relative -mt-[68px] flex min-h-svh items-center justify-center overflow-hidden bg-[#0E1228]">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ contain: "paint", willChange: "transform" }}
      >
        <NightScene />
      </div>

      <div className="relative z-10 w-full max-w-[1280px] px-6 pt-[120px] pb-12 md:px-10 md:pt-[140px] lg:-translate-x-10 xl:-translate-x-16">
        <Suspense>
          <SwapBody />
        </Suspense>
      </div>

      <SiteFooter />
    </section>
  );
}
