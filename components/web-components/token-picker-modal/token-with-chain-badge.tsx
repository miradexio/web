import Image from "next/image";
import type { Token } from "../types";
import { ChainIcon } from "./chain-icon";

type TokenWithChainBadgeProps = {
  readonly token: Token;
};

export function TokenWithChainBadge({ token }: TokenWithChainBadgeProps) {
  return (
    <div className="relative h-9 w-9 shrink-0">
      <Image
        src={token.icon}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 rounded-full"
        unoptimized
      />
      <div className="absolute -bottom-0.5 -right-0.5 ring-2 ring-bg rounded-full">
        <ChainIcon chain={token.network} size={14} />
      </div>
    </div>
  );
}
