export type StatusTone = "progress" | "success" | "warn" | "fail";

interface StatusDescriptor {
  readonly label: string;
  readonly tone: StatusTone;
}

const PHASE_DESCRIPTORS: Readonly<Record<string, StatusDescriptor>> = {
  creating: { label: "Creating", tone: "progress" },
  "solving-pow": { label: "Creating", tone: "progress" },
  "creating-swap": { label: "Creating", tone: "progress" },
  preparing: { label: "Preparing", tone: "progress" },
  "awaiting-deposit": { label: "Deposit pending", tone: "progress" },
  "deposit-detected": { label: "Depositing", tone: "progress" },
  depositing: { label: "Depositing", tone: "progress" },
  swapping: { label: "Swapping", tone: "progress" },
  sending: { label: "Sending", tone: "progress" },
  cancelling: { label: "Cancelling", tone: "warn" },
  "verifying-cancel": { label: "Cancelling", tone: "warn" },
  refunding: { label: "Refunding", tone: "warn" },
  completed: { label: "Completed", tone: "success" },
  failed: { label: "Failed", tone: "fail" },
  refunded: { label: "Refunded", tone: "warn" },
  expired: { label: "Expired", tone: "warn" },
  cancelled: { label: "Cancelled", tone: "warn" },
  punished: { label: "Punished", tone: "fail" },
  "verification-failed": { label: "Verification failed", tone: "fail" },
};

export function statusDescriptor(phase: string): StatusDescriptor {
  return PHASE_DESCRIPTORS[phase] ?? { label: humanize(phase), tone: "progress" };
}

function humanize(phase: string): string {
  return phase.replace(/-/g, " ").replace(/_/g, " ");
}

export function statusToneClass(tone: StatusTone): string {
  switch (tone) {
    case "success":
      return "text-green";
    case "fail":
      return "text-[#FF6B6B]";
    case "warn":
      return "text-accent-soft";
    case "progress":
    default:
      return "text-accent";
  }
}

export function statusDotClass(tone: StatusTone): string {
  switch (tone) {
    case "success":
      return "bg-green";
    case "fail":
      return "bg-[#FF6B6B]";
    case "warn":
      return "bg-accent-soft";
    case "progress":
    default:
      return "bg-accent";
  }
}
