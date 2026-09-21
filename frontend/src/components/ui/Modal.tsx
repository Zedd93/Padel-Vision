import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  size?: ModalSize;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

const SIZE_STYLES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-lime",
  iconBgColor = "bg-lime/15",
  size = "md",
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  children,
  className,
}: ModalProps) {
  // ESC key handling
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showHeader = Boolean(title || Icon || showCloseButton);

  return createPortal(
    <div
      className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        className={cn(
          "modal-content relative w-full rounded-2xl border border-border bg-bg2 shadow-2xl",
          SIZE_STYLES[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <div className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {Icon && (
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                    iconBgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
              )}
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
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 rounded-lg p-1 text-muted transition-colors hover:bg-bg3 hover:text-text"
                aria-label="Zamknij"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="p-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border p-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
