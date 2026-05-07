import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { HeadlinesCard } from "@/components/swap/swap-panel/headlines-card";

type ShellMessageProps = {
  readonly label: string;
  readonly message?: string;
  readonly action?: ReactNode;
};

export function ShellMessage({ label, message, action }: ShellMessageProps): React.JSX.Element {
  return (
    <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,480px)_320px] lg:gap-8">
      <aside className="hidden lg:order-1 lg:flex lg:flex-col lg:gap-3">
        <HeadlinesCard />
      </aside>

      <div className="order-1 mx-auto w-full max-w-[480px] lg:order-2">
        <article className="rounded-2xl border border-bg/15 bg-surface p-5 text-bg">
          <div className="flex items-center gap-2.5 px-1">
            {!action && <Loader2 className="h-3.5 w-3.5 animate-spin text-bg/65" />}
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-bg">
              {label}
            </span>
          </div>
          {message && (
            <p className="mt-3 text-[13.5px] leading-[1.55] text-bg/70">{message}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </article>
      </div>

      <div className="hidden lg:order-3 lg:block" aria-hidden="true" />
    </div>
  );
}
