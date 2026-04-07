import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-lime text-black font-bold hover:bg-lime-hover focus-visible:ring-2 focus-visible:ring-lime/50",
  secondary:
    "border border-border text-text hover:border-lime hover:text-lime",
  danger:
    "bg-red-500 text-white font-semibold hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-500/50",
  ghost: "text-muted hover:text-text hover:bg-bg3",
  outline:
    "border border-border bg-bg3 text-text hover:border-lime hover:text-lime",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-[11px] gap-1 rounded-md",
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2 text-sm gap-2 rounded-lg",
  lg: "px-6 py-3 text-base gap-2 rounded-xl",
};

const ICON_SIZE: Record<ButtonSize, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      iconPosition = "left",
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200",
          "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          fullWidth && "w-full",
          className
        )}
        {...rest}
      >
        {Icon && iconPosition === "left" && (
          <Icon className={cn(ICON_SIZE[size], loading && "animate-spin")} />
        )}
        {children}
        {Icon && iconPosition === "right" && (
          <Icon className={cn(ICON_SIZE[size], loading && "animate-spin")} />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
