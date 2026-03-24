import { useState, useEffect, useCallback } from "react";
import {
  Lock,
  Play,
  Clock,
  Eye,
  Trophy,
  Star,
  Loader2,
  Check,
  Ticket,
  Package,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface PPVGateProps {
  streamId: string;
  streamTitle: string;
  clubName: string;
  /** Price for single match access */
  matchPrice: number;
  /** Price for full tournament bundle */
  bundlePrice?: number;
  /** Seconds of free preview (default 300 = 5 min) */
  freePreviewSeconds?: number;
  /** Tournament start time ISO string */
  startsAt?: string;
  /** Whether user already purchased access */
  hasPurchased?: boolean;
  /** Callback when access is granted */
  onAccessGranted: () => void;
}

/* ─── Helpers ──────────────────────────────────── */

function formatPrice(price: number): string {
  return `${price.toFixed(2).replace(".", ",")} zł`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Teraz!";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/* ─── Component ────────────────────────────────── */

export function PPVGate({
  streamId,
  streamTitle,
  clubName,
  matchPrice,
  bundlePrice,
  freePreviewSeconds = 300,
  startsAt,
  hasPurchased = false,
  onAccessGranted,
}: PPVGateProps) {
  const [previewTimeLeft, setPreviewTimeLeft] = useState(freePreviewSeconds);
  const [previewExpired, setPreviewExpired] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(hasPurchased);
  const [selectedOption, setSelectedOption] = useState<"match" | "bundle">(
    "match"
  );
  const [countdown, setCountdown] = useState<number | null>(null);

  // Free preview timer
  useEffect(() => {
    if (purchased || previewExpired) return;
    const timer = setInterval(() => {
      setPreviewTimeLeft((t) => {
        if (t <= 1) {
          setPreviewExpired(true);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [purchased, previewExpired]);

  // Countdown to event start
  useEffect(() => {
    if (!startsAt) return;
    const update = () => {
      const diff = new Date(startsAt).getTime() - Date.now();
      setCountdown(diff > 0 ? diff : null);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startsAt]);

  const handlePurchase = useCallback(async () => {
    setPurchasing(true);
    // Simulate Stripe Checkout
    await new Promise((r) => setTimeout(r, 2000));

    // Fire and forget: POST /api/stripe/ppv
    fetch("/api/stripe/ppv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        streamId,
        type: selectedOption,
        price: selectedOption === "bundle" ? bundlePrice : matchPrice,
      }),
    }).catch(() => {});

    setPurchased(true);
    setPurchasing(false);
    onAccessGranted();
  }, [streamId, selectedOption, bundlePrice, matchPrice, onAccessGranted]);

  // If already purchased, don't show gate
  if (purchased) return null;

  // During free preview (not expired yet) — show warning bar
  if (!previewExpired) {
    const pct = (previewTimeLeft / freePreviewSeconds) * 100;
    return (
      <div className="absolute bottom-0 left-0 right-0 z-30">
        {/* Progress bar */}
        <div className="h-1 bg-bg4">
          <div
            className="h-full bg-orange transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Warning bar */}
        <div className="flex items-center justify-between bg-black/80 px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-orange" />
            <span className="text-xs text-white/80">
              Darmowy podgląd:{" "}
              <span className="font-mono font-bold text-orange">
                {Math.floor(previewTimeLeft / 60)}:
                {(previewTimeLeft % 60).toString().padStart(2, "0")}
              </span>
            </span>
          </div>
          <button
            onClick={() => setPreviewExpired(true)}
            className="rounded-lg bg-lime px-3 py-1 text-xs font-bold text-black transition-colors hover:bg-lime2"
          >
            Kup dostęp
          </button>
        </div>
      </div>
    );
  }

  // Preview expired — full gate
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="mx-4 w-full max-w-md">
        {/* Lock icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/10">
            <Lock className="h-8 w-8 text-lime" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-display text-xl text-white">
          Treść płatna (PPV)
        </h2>
        <p className="mb-1 text-center text-sm text-white/60">
          {streamTitle}
        </p>
        <p className="mb-6 text-center text-xs text-white/40">
          {clubName}
        </p>

        {/* Countdown */}
        {countdown !== null && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-3">
            <Clock className="h-4 w-4 text-lime" />
            <span className="text-sm text-white/80">
              Start za{" "}
              <span className="font-mono font-bold text-lime">
                {formatCountdown(countdown)}
              </span>
            </span>
          </div>
        )}

        {/* Purchase options */}
        <div className="space-y-3">
          {/* Single match */}
          <button
            onClick={() => setSelectedOption("match")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
              selectedOption === "match"
                ? "border-lime bg-lime/5"
                : "border-white/10 bg-white/5 hover:border-white/20"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                selectedOption === "match"
                  ? "bg-lime/20"
                  : "bg-white/10"
              )}
            >
              <Ticket
                className={cn(
                  "h-5 w-5",
                  selectedOption === "match" ? "text-lime" : "text-white/60"
                )}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                Pojedynczy mecz
              </p>
              <p className="text-xs text-white/50">
                Dostęp do tego meczu + VOD
              </p>
            </div>
            <span className="text-lg font-bold text-lime">
              {formatPrice(matchPrice)}
            </span>
          </button>

          {/* Tournament bundle */}
          {bundlePrice && (
            <button
              onClick={() => setSelectedOption("bundle")}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                selectedOption === "bundle"
                  ? "border-lime bg-lime/5"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              )}
            >
              {/* Best value badge */}
              <div className="absolute -right-1 -top-2">
                <span className="flex items-center gap-1 rounded-full bg-orange px-2 py-0.5 text-[9px] font-bold text-black">
                  <Star className="h-2.5 w-2.5" />
                  NAJLEPSZA WARTOŚĆ
                </span>
              </div>

              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  selectedOption === "bundle"
                    ? "bg-lime/20"
                    : "bg-white/10"
                )}
              >
                <Package
                  className={cn(
                    "h-5 w-5",
                    selectedOption === "bundle"
                      ? "text-lime"
                      : "text-white/60"
                  )}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  Cały turniej
                </p>
                <p className="text-xs text-white/50">
                  Wszystkie mecze + VOD + skróty
                </p>
              </div>
              <span className="text-lg font-bold text-lime">
                {formatPrice(bundlePrice)}
              </span>
            </button>
          )}
        </div>

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3 text-sm font-bold text-black transition-all hover:bg-lime2 disabled:opacity-50"
        >
          {purchasing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Przetwarzanie płatności...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Kup dostęp —{" "}
              {formatPrice(
                selectedOption === "bundle"
                  ? (bundlePrice ?? matchPrice)
                  : matchPrice
              )}
            </>
          )}
        </button>

        {/* Free preview note */}
        <p className="mt-3 text-center text-[10px] text-white/30">
          Darmowy podgląd ({Math.floor(freePreviewSeconds / 60)} min) wygasł.
          Kup dostęp aby kontynuować oglądanie.
        </p>
      </div>
    </div>
  );
}
