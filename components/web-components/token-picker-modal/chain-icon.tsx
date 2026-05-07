import Image from "next/image";
import { CHAIN_ICONS, chainIconKey } from "./chain-icons";

type ChainIconProps = {
  readonly chain: string;
  readonly size: number;
};

export function ChainIcon({ chain, size }: ChainIconProps) {
  const iconPath = CHAIN_ICONS[chainIconKey(chain)];
  if (iconPath) {
    return (
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-2"
        style={{ width: size, height: size }}
      >
        <Image
          src={iconPath}
          alt={chain}
          width={size}
          height={size}
          className="object-contain"
          style={{ width: size, height: size }}
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-ink/15 font-bold text-ink"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {chain.charAt(0).toUpperCase()}
    </div>
  );
}
