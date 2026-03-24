import { useState } from "react";
import { Monitor, Smartphone, Maximize2 } from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

type StreamFormat = "horizontal" | "vertical";

interface FormatSwitcherProps {
  currentFormat: StreamFormat;
  onFormatChange: (format: StreamFormat) => void;
  /** Compact variant for small spaces */
  compact?: boolean;
}

/* ─── Component ────────────────────────────────── */

export function FormatSwitcher({
  currentFormat,
  onFormatChange,
  compact = false,
}: FormatSwitcherProps) {
  const formats: {
    key: StreamFormat;
    icon: typeof Monitor;
    label: string;
    ratio: string;
  }[] = [
    { key: "horizontal", icon: Monitor, label: "Poziomy", ratio: "16:9" },
    { key: "vertical", icon: Smartphone, label: "Pionowy", ratio: "9:16" },
  ];

  if (compact) {
    return (
      <button
        onClick={() =>
          onFormatChange(
            currentFormat === "horizontal" ? "vertical" : "horizontal"
          )
        }
        className="flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white/70 backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white"
        title={
          currentFormat === "horizontal"
            ? "Przełącz na tryb mobilny"
            : "Przełącz na tryb desktopowy"
        }
      >
        {currentFormat === "horizontal" ? (
          <Smartphone className="h-3.5 w-3.5" />
        ) : (
          <Monitor className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-bg3 p-1">
      {formats.map((format) => {
        const Icon = format.icon;
        const isActive = currentFormat === format.key;

        return (
          <button
            key={format.key}
            onClick={() => onFormatChange(format.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              isActive
                ? "bg-lime/10 text-lime shadow-sm"
                : "text-muted hover:bg-bg4 hover:text-text"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{format.label}</span>
            <span
              className={cn(
                "font-mono text-[9px]",
                isActive ? "text-lime/70" : "text-muted/50"
              )}
            >
              {format.ratio}
            </span>
          </button>
        );
      })}
    </div>
  );
}
