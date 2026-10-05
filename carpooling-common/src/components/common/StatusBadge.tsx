import { Badge } from "../ui/badge";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "muted";

interface StatusConfig {
  variant: BadgeVariant;
  label: string;
  customClass?: string;
}

const statusMap: Record<string, StatusConfig> = {
  PENDING:   { variant: "outline", label: "Pending",   customClass: "bg-amber-500/15 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800" },
  ACCEPTED:  { variant: "outline", label: "Accepted",  customClass: "bg-emerald-500/15 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800" },
  APPROVED:  { variant: "outline", label: "Approved",  customClass: "bg-emerald-500/15 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800" },
  REJECTED:  { variant: "outline", label: "Rejected",  customClass: "bg-rose-500/15 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800" },
  CANCELLED: { variant: "outline", label: "Cancelled", customClass: "bg-rose-500/15 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800" },
  COMPLETED: { variant: "outline", label: "Completed", customClass: "bg-emerald-500/15 text-emerald-800 font-semibold border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800" },
  SCHEDULED: { variant: "outline", label: "Scheduled", customClass: "bg-sky-500/15 text-sky-800 font-semibold border-sky-400 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800" },
  ONGOING:   { variant: "outline", label: "Ongoing",   customClass: "bg-amber-500/15 text-amber-800 font-semibold border-amber-400 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800" },
};

export default function StatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  if (!status) return null;
  const upper = status.toUpperCase();
  const config = statusMap[upper] ?? {
    variant: "muted" as BadgeVariant,
    label: status,
  };

  return (
    <Badge
      variant={config.variant}
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-2xs ${config.customClass || ""} ${className || ""}`}
    >
      {config.label}
    </Badge>
  );
}
export { StatusBadge };
