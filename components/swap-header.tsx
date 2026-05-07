import Link from "next/link";
import { HistoryButton } from "@/components/history/history-button";
import { KeystoresButton } from "@/components/keystore/keystores-button";
import { NetworkBadge } from "@/components/network-badge";

const HOMEPAGE_URL = process.env.NEXT_PUBLIC_HOMEPAGE_URL ?? "/";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function SwapHeader(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40">
      <div className="flex h-[68px] items-center justify-between gap-3 px-6 md:px-8">
        <Link href={HOMEPAGE_URL} className="shrink-0" aria-label="Miradex home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/logo.svg`} alt="Miradex" className="h-7 w-auto sm:h-8" />
        </Link>
        <div className="flex items-center gap-2">
          <KeystoresButton />
          <HistoryButton />
        </div>
      </div>
      <NetworkBadge />
    </header>
  );
}
