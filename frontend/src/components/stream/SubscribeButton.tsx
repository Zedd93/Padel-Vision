import { useState, useRef, useEffect } from "react";
import {
  Heart,
  Crown,
  Gift,
  Check,
  Star,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface SubscribeButtonProps {
  clubSlug: string;
  clubName: string;
  /** Compact mode for stream page, full mode for club page */
  variant?: "compact" | "full";
}

interface SubTier {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  icon: typeof Star;
  color: string;
}

/* ─── Tiers ────────────────────────────────────── */

const SUB_TIERS: SubTier[] = [
  {
    id: "basic",
    name: "Subskrypcja",
    price: 9,
    benefits: [
      "Brak reklam na kanale",
      "Badge subskrybenta w czacie",
      "Ekskluzywne emotes klubu",
    ],
    icon: Heart,
    color: "text-lime",
  },
  {
    id: "super",
    name: "Super Sub",
    price: 19,
    benefits: [
      "Wszystko z planu podstawowego",
      "Wyróżniony nick w czacie",
      "Dostęp do VOD w jakości 4K",
      "Priorytetowy czat z moderatorem",
    ],
    icon: Crown,
    color: "text-yellow-400",
  },
];

/* ─── Component ────────────────────────────────── */

export function SubscribeButton({
  clubSlug,
  clubName,
  variant = "compact",
}: SubscribeButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("basic");
  const [processing, setProcessing] = useState(false);
  const [giftUsername, setGiftUsername] = useState("");
  const [justSubscribed, setJustSubscribed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
        setShowGiftModal(false);
      }
    }
    if (showModal || showGiftModal)
      document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModal, showGiftModal]);

  const handleSubscribe = async () => {
    setProcessing(true);
    // Simulate Stripe checkout
    await new Promise((r) => setTimeout(r, 1500));

    // Fire and forget: POST /api/stripe/channel-sub
    fetch("/api/stripe/channel-sub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubSlug,
        tier: selectedTier,
        action: "subscribe",
      }),
    }).catch(() => {});

    setIsSubscribed(true);
    setProcessing(false);
    setShowModal(false);
    setJustSubscribed(true);
    setTimeout(() => setJustSubscribed(false), 3000);
  };

  const handleGiftSub = async () => {
    if (!giftUsername.trim()) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));

    fetch("/api/stripe/channel-sub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubSlug,
        tier: selectedTier,
        action: "gift",
        giftTo: giftUsername,
      }),
    }).catch(() => {});

    setProcessing(false);
    setShowGiftModal(false);
    setGiftUsername("");
  };

  const handleUnsubscribe = () => {
    setIsSubscribed(false);
    fetch("/api/stripe/channel-sub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubSlug, action: "unsubscribe" }),
    }).catch(() => {});
  };

  return (
    <>
      {/* Subscribe / Subscribed button */}
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <div className="group relative">
            <button
              onClick={() => setShowModal(true)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                "border-lime/30 bg-lime/10 text-lime hover:bg-lime/20",
                justSubscribed && "animate-pulse"
              )}
            >
              <Check className="h-4 w-4" />
              Subskrybujesz
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className={cn(
              "flex items-center gap-2 rounded-xl font-medium transition-all",
              variant === "compact"
                ? "bg-lime px-4 py-2 text-sm text-black hover:bg-lime2"
                : "bg-lime px-6 py-2.5 text-sm text-black hover:bg-lime2"
            )}
          >
            <Heart className="h-4 w-4" />
            Subskrybuj
          </button>
        )}

        {/* Gift sub button */}
        {!isSubscribed && (
          <button
            onClick={() => setShowGiftModal(true)}
            className="rounded-xl border border-border bg-bg3 p-2 text-muted transition-colors hover:border-lime hover:text-lime"
            title="Podaruj subskrypcję"
          >
            <Gift className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Subscribe Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg2 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-lime" />
                <h3 className="text-display text-lg">
                  {isSubscribed
                    ? "Zarządzaj subskrypcją"
                    : `Subskrybuj ${clubName}`}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted transition-colors hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {isSubscribed ? (
                /* Manage subscription */
                <div className="space-y-4">
                  <div className="rounded-lg bg-lime/5 border border-lime/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-5 w-5 text-lime" />
                      <p className="text-sm font-semibold text-text">
                        Aktywna subskrypcja
                      </p>
                    </div>
                    <p className="text-xs text-muted">
                      Subskrybujesz {clubName} od 1 marca 2026
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Następna płatność: 1 kwietnia 2026 · 9 zł
                    </p>
                  </div>

                  <button
                    onClick={() => setShowGiftModal(true)}
                    className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    <Gift className="h-4 w-4" />
                    Podaruj sub komuś
                  </button>

                  <button
                    onClick={handleUnsubscribe}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Anuluj subskrypcję
                  </button>
                </div>
              ) : (
                /* Choose tier & subscribe */
                <div className="space-y-4">
                  {/* Tier cards */}
                  {SUB_TIERS.map((tier) => {
                    const TierIcon = tier.icon;
                    return (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all",
                          selectedTier === tier.id
                            ? "border-lime bg-lime/5"
                            : "border-border bg-bg3 hover:border-border hover:bg-bg4"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TierIcon
                              className={cn("h-5 w-5", tier.color)}
                            />
                            <span className="text-sm font-semibold text-text">
                              {tier.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-lime">
                            {tier.price} zł/mies.
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {tier.benefits.map((b) => (
                            <li
                              key={b}
                              className="flex items-center gap-2 text-xs text-muted"
                            >
                              <Check className="h-3 w-3 text-lime" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}

                  {/* Revenue split info */}
                  <p className="text-center text-[10px] text-muted">
                    70% trafia do klubu · 30% do platformy
                  </p>

                  {/* Subscribe button */}
                  <button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Przetwarzanie...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4" />
                        Subskrybuj za{" "}
                        {SUB_TIERS.find((t) => t.id === selectedTier)?.price} zł/mies.
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gift Sub Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="mx-4 w-full max-w-sm rounded-xl border border-border bg-bg2 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-lime" />
                <h3 className="text-display text-lg">Podaruj subskrypcję</h3>
              </div>
              <button
                onClick={() => setShowGiftModal(false)}
                className="text-muted transition-colors hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-muted">
                Podaruj subskrypcję {clubName} innemu widzowi!
              </p>

              <div>
                <label className="mb-1 block text-sm text-muted">
                  Nazwa użytkownika
                </label>
                <input
                  type="text"
                  value={giftUsername}
                  onChange={(e) => setGiftUsername(e.target.value)}
                  placeholder="Wpisz nick odbiorcy..."
                  className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none"
                />
              </div>

              <div className="rounded-lg bg-bg3 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Subskrypcja</span>
                  <span className="font-medium text-text">
                    {SUB_TIERS.find((t) => t.id === selectedTier)?.price} zł
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  Odbiorca otrzyma 1 miesiąc subskrypcji {clubName}
                </p>
              </div>

              <button
                onClick={handleGiftSub}
                disabled={processing || !giftUsername.trim()}
                className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4" />
                    Podaruj subskrypcję
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
