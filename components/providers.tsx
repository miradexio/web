"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useHistorySync } from "@/hooks/use-history-sync";
import { KeystoreBackupModalAuto } from "@/components/keystore/keystore-backup-modal";
import { getRegistry } from "@/lib/miradex-web/registry";

function RegistryInitializer(): null {
  useEffect(() => {
    // Eager singleton so the first hook call doesn't block on init.
    getRegistry();
  }, []);
  return null;
}

function HistorySyncMount(): null {
  useHistorySync();
  return null;
}

export function Providers({ children }: { readonly children: ReactNode }): React.JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <RegistryInitializer />
        <HistorySyncMount />
        {children}
        <KeystoreBackupModalAuto />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
