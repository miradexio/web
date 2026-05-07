const NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 6,
});

const USD_FORMATTER = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PLACEHOLDER = "—";

export function formatAmount(value: string, decimals = 6): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return PLACEHOLDER;
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function formatUsd(value: string | null): string {
  if (value === null) return PLACEHOLDER;
  const n = parseFloat(value);
  if (Number.isNaN(n) || n === 0) return PLACEHOLDER;
  return USD_FORMATTER.format(n);
}

export function formatExpiresIn(expiresAt: string | null, now: number): string | null {
  if (expiresAt === null) return null;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return null;
  const ms = expiry - now;
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function dateGroupLabel(iso: string, now: Date): string {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "Earlier";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const day = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === yesterday.getTime()) return "Yesterday";
  return created.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: created.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export { NUMBER_FORMATTER };
