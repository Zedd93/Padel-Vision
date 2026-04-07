import type { LucideIcon } from "lucide-react";
import { Badge, type BadgeSize, type BadgeVariant } from "./Badge";

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "failed"
  | "banned"
  | "suspended"
  | "live"
  | "draft"
  | "published"
  | "completed"
  | "processing";

const STATUS_CONFIG: Record<
  StatusType,
  { variant: BadgeVariant; defaultLabel: string }
> = {
  active: { variant: "success", defaultLabel: "Aktywny" },
  inactive: { variant: "neutral", defaultLabel: "Nieaktywny" },
  pending: { variant: "warning", defaultLabel: "Oczekuje" },
  approved: { variant: "success", defaultLabel: "Zatwierdzono" },
  rejected: { variant: "danger", defaultLabel: "Odrzucono" },
  paid: { variant: "success", defaultLabel: "Zapłacono" },
  failed: { variant: "danger", defaultLabel: "Niepowodzenie" },
  banned: { variant: "danger", defaultLabel: "Zbanowany" },
  suspended: { variant: "warning", defaultLabel: "Zawieszony" },
  live: { variant: "live", defaultLabel: "Live" },
  draft: { variant: "neutral", defaultLabel: "Szkic" },
  published: { variant: "info", defaultLabel: "Opublikowane" },
  completed: { variant: "success", defaultLabel: "Zakończone" },
  processing: { variant: "info", defaultLabel: "Przetwarzanie" },
};

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: BadgeSize;
  icon?: LucideIcon;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = "sm",
  icon,
  pulse,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={icon}
      pulse={pulse ?? status === "live"}
      className={className}
    >
      {label ?? config.defaultLabel}
    </Badge>
  );
}
