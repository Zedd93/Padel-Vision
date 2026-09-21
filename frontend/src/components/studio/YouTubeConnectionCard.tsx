import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Youtube,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { youtubeApi } from "@/api/youtube";

/**
 * Połączenie klubu z kanałem YouTube plus dane ingestu do OBS.
 *
 * Adres i klucz są stałe dla klubu (YouTube tworzy strumień wielokrotnego
 * użytku), więc OBS konfiguruje się raz, a nie przed każdym meczem.
 */
export function YouTubeConnectionCard() {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: connection, isLoading } = useQuery({
    queryKey: ["youtube", "status"],
    queryFn: youtubeApi.getStatus,
    retry: false,
  });

  const connectMutation = useMutation({
    mutationFn: youtubeApi.getAuthorizationUrl,
    onSuccess: (url) => {
      // Zgoda Google musi odbyc sie w oknie przegladarki klubu
      window.location.href = url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: youtubeApi.disconnect,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["youtube", "status"] }),
  });

  const copy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="glass-card flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  /* ─── Kanał niepodłączony ─────────────────────── */

  if (!connection?.connected) {
    return (
      <div className="glass-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Youtube className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-text">Kanał YouTube</h3>
        </div>

        <p className="mb-4 text-xs text-muted">
          Transmisje lecą przez kanał YouTube klubu. Połącz go raz — adres i klucz do
          OBS będą już stałe.
        </p>

        <button
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          {connectMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Youtube className="h-4 w-4" />
          )}
          Połącz kanał YouTube
        </button>

        {connectMutation.isError && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-red-400">
            <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            Nie udało się rozpocząć łączenia. Sprawdź, czy integracja jest skonfigurowana
            po stronie serwera.
          </p>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-muted">
          Kanał musi mieć włączone transmisje na żywo. Pierwsze włączenie na nowym
          kanale zajmuje u YouTube do 24 godzin.
        </p>
      </div>
    );
  }

  /* ─── Kanał podłączony ────────────────────────── */

  const revoked = connection.status === "REVOKED";

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Youtube className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-text">Kanał YouTube</h3>
        </div>
        <button
          onClick={() => disconnectMutation.mutate()}
          disabled={disconnectMutation.isPending}
          className="flex items-center gap-1 text-[10px] text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
        >
          <Unlink className="h-2.5 w-2.5" />
          Rozłącz
        </button>
      </div>

      <div
        className={cn(
          "mb-4 flex items-center gap-2 rounded-lg px-3 py-2",
          revoked ? "bg-orange/10" : "bg-lime/10"
        )}
      >
        {revoked ? (
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-orange" />
        ) : (
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-lime" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">
            {connection.channelTitle ?? "Kanał YouTube"}
          </p>
          <p className="text-[10px] text-muted">
            {revoked ? "Zgoda cofnięta — połącz kanał ponownie" : "Połączony"}
          </p>
        </div>
        {connection.channelId && !revoked && (
          <a
            href={`https://www.youtube.com/channel/${connection.channelId}`}
            target="_blank"
            rel="noreferrer"
            className="text-muted transition-colors hover:text-lime"
            title="Otwórz kanał na YouTube"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {connection.ingestAddress && connection.ingestStreamName ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Adres serwera (OBS)</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={connection.ingestAddress}
                className="flex-1 rounded-lg border border-border bg-bg3 px-3 py-2 font-mono text-sm text-text"
              />
              <button
                onClick={() => copy(connection.ingestAddress!, "address")}
                className="rounded-lg border border-border px-3 py-2 text-muted transition-colors hover:border-lime hover:text-lime"
                title="Kopiuj"
              >
                {copied === "address" ? (
                  <CheckCircle2 className="h-4 w-4 text-lime" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Klucz transmisji (OBS)</label>
            <div className="flex gap-2">
              <input
                type={showKey ? "text" : "password"}
                readOnly
                value={connection.ingestStreamName}
                className="flex-1 rounded-lg border border-border bg-bg3 px-3 py-2 font-mono text-sm text-text"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="rounded-lg border border-border px-3 py-2 text-muted transition-colors hover:border-lime hover:text-lime"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => copy(connection.ingestStreamName!, "key")}
                className="rounded-lg border border-border px-3 py-2 text-muted transition-colors hover:border-lime hover:text-lime"
                title="Kopiuj"
              >
                {copied === "key" ? (
                  <CheckCircle2 className="h-4 w-4 text-lime" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-muted">
              Nie udostępniaj klucza — kto go ma, może nadawać na kanał klubu.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Adres i klucz pojawią się po utworzeniu pierwszej transmisji.
        </p>
      )}
    </div>
  );
}
