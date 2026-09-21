import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export type BadgeVariant =
  | "neutral"
  | "lime"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "live"
  | "purple"
  | "orange";

export type BadgeSize = "xs" | "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: LucideIcon;
  pulse?: boolean;
  rounded?: "full" | "md";
  children: ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  neutral: "bg-bg3 text-muted ring-1 ring-border",
  lime: "bg-lime/15 text-lime ring-1 ring-lime/30",
  success: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  warning: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
  danger: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  info: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
  live: "bg-live text-white",
  purple: "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30",
  orange: "bg-orange/15 text-orange ring-1 ring-orange/30",
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0.5 text-[9px] gap-1",
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

const ICON_SIZE: Record<BadgeSize, string> = {
  xs: "h-2.5 w-2.5",
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "neutral",
      size = "sm",
      icon: Icon,
      pulse = false,
      rounded = "full",
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-semibold uppercase tracking-wide whitespace-nowrap",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          rounded === "full" ? "rounded-full" : "rounded-md",
          className
        )}
        {...rest}
      >
        {pulse && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-current",
              "animate-live-pulse"
            )}
          />
        )}
        {Icon && <Icon className={ICON_SIZE[size]} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
