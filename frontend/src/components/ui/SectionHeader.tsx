import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: ReactNode;
  level?: "h1" | "h2" | "h3";
  className?: string;
}

const TITLE_SIZES: Record<"h1" | "h2" | "h3", string> = {
  h1: "text-3xl",
  h2: "text-2xl",
  h3: "text-xl",
};

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-lime",
  actions,
  level = "h2",
  className,
}: SectionHeaderProps) {
  const Tag = level;
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 mb-6",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-bg3 border border-border">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
        <div className="min-w-0">
          <Tag className={cn("text-display leading-tight", TITLE_SIZES[level])}>
            {title}
          </Tag>
          {subtitle && (
            <p className="mt-1 text-xs text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
