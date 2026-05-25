import Link from "next/link";
import { NightScene } from "../components/web-components/night-scene";
import { ArrowIcon } from "../components/web-components/icons";

export default function NotFound() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ contain: "paint", willChange: "transform" }}
      >
        <NightScene />
      </div>

      <div className="relative z-10 shell flex min-h-[calc(100svh-68px)] flex-col justify-center py-20">
        <div className="max-w-[640px]">
          <div className="mb-2 font-mono text-[14px] uppercase tracking-[0.2em] text-accent">
            Route not found
          </div>

          <div className="h-display mb-2 text-[clamp(120px,20vw,240px)] leading-[0.8]">
            404
          </div>

          <h1 className="h-display mb-6">
            Lost in the <em>sand</em>.
          </h1>

          <p className="lede mb-10 text-ink">
            The swap route or page you are looking for doesn&apos;t exist. 
            The coordinates might have been lost in the desert.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/swap"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-[14px] text-[14px] font-medium text-bg transition-colors duration-150 hover:bg-accent-soft"
            >
              Back to Swap <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
