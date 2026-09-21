import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export interface FilterTabOption<T extends string = string> {
  value: T;
  label: ReactNode;
  count?: number;
  icon?: LucideIcon;
}

export interface FilterTabsProps<T extends string = string> {
  options: FilterTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  variant?: "segmented" | "pills";
  fullWidth?: boolean;
  className?: string;
}

export function FilterTabs<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  variant = "segmented",
  fullWidth = false,
  className,
}: FilterTabsProps<T>) {
  const isSegmented = variant === "segmented";

  return (
    <div
      className={cn(
        "inline-flex items-center",
        isSegmented &&
          "rounded-lg border border-border bg-bg3 p-0.5",
        !isSegmented && "gap-2",
        fullWidth && "w-full",
        className
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center font-medium transition-all whitespace-nowrap",
              fullWidth && "flex-1",
              size === "sm" && "px-2.5 py-1 text-[11px] gap-1.5",
              size === "md" && "px-3 py-1.5 text-xs gap-2",
              isSegmented && "rounded-md",
              !isSegmented && "rounded-full border",
              selected && isSegmented && "bg-lime text-black",
              !selected && isSegmented && "text-muted hover:text-text",
              selected && !isSegmented && "border-lime bg-lime/10 text-lime",
              !selected && !isSegmented && "border-border text-muted hover:border-lime/40 hover:text-text"
            )}
          >
            {Icon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
            {opt.label}
            {typeof opt.count === "number" && (
              <span
                className={cn(
                  "rounded px-1 text-[9px] font-bold",
                  selected
                    ? isSegmented
                      ? "bg-black/20 text-black"
                      : "bg-lime/20 text-lime"
                    : "bg-bg4 text-muted"
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
