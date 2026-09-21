import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const PADDING_STYLES = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { hoverable = false, padding = "md", className, children, ...rest },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card",
          hoverable && "glass-card-hover cursor-pointer",
          PADDING_STYLES[padding],
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, actions, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between gap-4 border-b border-border pb-3 mb-4",
          className
        )}
        {...rest}
      >
        <div className="min-w-0 flex-1">
          {typeof title === "string" ? (
            <h3 className="text-display text-lg leading-tight">{title}</h3>
          ) : (
            title
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";
