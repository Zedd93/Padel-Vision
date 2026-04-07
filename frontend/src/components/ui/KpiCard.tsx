import { forwardRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  change?: string;
  positive?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export const KpiCard = forwardRef<HTMLDivElement, KpiCardProps>(
  (
    {
      label,
      value,
      change,
      positive = true,
      icon: Icon,
      iconColor = "text-lime",
      description,
      href,
      onClick,
      className,
    },
    ref
  ) => {
    const interactive = Boolean(href || onClick);
    const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;

    const content = (
      <>
        <div className="mb-2 flex items-center justify-between">
          {Icon ? (
            <Icon className={cn("h-5 w-5", iconColor)} />
          ) : (
            <span />
          )}
          {change && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold",
                positive ? "text-emerald-400" : "text-red-400"
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {change}
            </span>
          )}
        </div>
        <p className="text-display text-2xl leading-tight">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{label}</p>
        {description && (
          <p className="mt-1 text-[10px] text-muted/70 opacity-0 transition-opacity group-hover:opacity-100">
            {description}
          </p>
        )}
      </>
    );

    const baseClasses = cn(
      "glass-card group relative p-4 transition-all duration-200",
      interactive && "cursor-pointer hover:scale-[1.02] hover:border-lime/40",
      className
    );

    if (href) {
      return (
        <Link to={href} className={baseClasses}>
          {content}
        </Link>
      );
    }

    return (
      <div ref={ref} onClick={onClick} className={baseClasses}>
        {content}
      </div>
    );
  }
);

KpiCard.displayName = "KpiCard";
