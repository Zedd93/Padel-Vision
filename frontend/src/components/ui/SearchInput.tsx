import { forwardRef, type InputHTMLAttributes } from "react";
import { Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "size"> {
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  size?: "sm" | "md";
  showClear?: boolean;
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      icon: Icon = Search,
      size = "md",
      showClear = true,
      placeholder = "Szukaj...",
      containerClassName,
      className,
      ...rest
    },
    ref
  ) => {
    const sizeClasses =
      size === "sm"
        ? "py-1.5 pl-8 pr-8 text-xs"
        : "py-2 pl-10 pr-10 text-sm";
    const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
    const iconLeft = size === "sm" ? "left-2.5" : "left-3";
    const iconRight = size === "sm" ? "right-2.5" : "right-3";

    return (
      <div className={cn("relative", containerClassName)}>
        <Icon
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none",
            iconLeft,
            iconSize
          )}
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-border bg-bg3 text-text",
            "placeholder:text-muted focus:border-lime focus:outline-none transition-colors",
            sizeClasses,
            className
          )}
          {...rest}
        />
        {showClear && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors",
              iconRight
            )}
            aria-label="Wyczyść"
          >
            <X className={iconSize} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
