import Image from "next/image";
import { getProviderDisplay } from "./helpers";

type ProviderIconProps = {
  readonly provider: string;
  readonly size?: number;
};

export function ProviderIcon({ provider, size = 28 }: ProviderIconProps) {
  const info = getProviderDisplay(provider);
  if (info.logo) {
    return (
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg/60 ring-1 ring-line-2"
        style={{ width: size, height: size }}
      >
        <Image
          src={info.logo}
          alt={info.label}
          width={size}
          height={size}
          className="h-full w-full object-contain p-0.5"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full ${info.color} font-bold text-bg`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-label={info.label}
    >
      {info.label.charAt(0)}
    </div>
  );
}
