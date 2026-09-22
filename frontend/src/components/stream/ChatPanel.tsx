import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useLatencyCompensatedEvents } from '@/hooks/useLatencyCompensatedEvents';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

/** Musi się zgadzać z ChatWebSocketController.MAX_MESSAGE_LENGTH */
const MAX_MESSAGE_LENGTH = 500;

/** Przy dużym ruchu nieograniczona lista zjadałaby pamięć przeglądarki */
const MAX_MESSAGES = 200;

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userImage?: string | null;
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  streamId: string;
  /**
   * O ile opóźnić cudze wiadomości, żeby reakcje nie wyprzedzały obrazu.
   * Własne wiadomości pokazujemy od razu — czekanie 20 s na własny wpis
   * wyglądałoby jak zepsuty czat.
   */
  delayMs?: number;
}

/**
 * Czat transmisji przez STOMP (backend: ChatWebSocketController).
 *
 * Tożsamość autora ustala serwer na podstawie tokenu z połączenia —
 * wysyłamy wyłącznie treść. Własnej wiadomości nie dodajemy lokalnie
 * przed wysłaniem: pojawi się, gdy serwer ją zapisze i odeśle, więc
 * nie ma duplikatów ani wiadomości, które "wysłały się", a nie dotarły.
 */
export default function ChatPanel({ streamId, delayMs = 0 }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const { connected, subscribe, publish } = useWebSocket();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES));
  }, []);

  const { push: pushMessage } = useLatencyCompensatedEvents<ChatMessage>(
    delayMs,
    appendMessage
  );

  const userId = user?.id;

  useEffect(() => {
    if (!connected) return;

    const subscription = subscribe(`/topic/stream.${streamId}.chat`, (frame) => {
      try {
        const data = JSON.parse(frame.body) as ChatMessage;
        // własne wiadomości omijają bufor, cudze czekają na obraz
        if (userId && data.userId === userId) {
          appendMessage(data);
        } else {
          pushMessage(data);
        }
      } catch {
        // uszkodzona ramka — pomijamy
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, streamId, subscribe, userId, appendMessage, pushMessage]);

  // Przewijamy listę, a nie całą stronę — scrollIntoView szarpałby widokiem na telefonie
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const content = input.trim();
  const canSend = connected && content.length > 0 && content.length <= MAX_MESSAGE_LENGTH;

  function handleSend() {
    if (!canSend) return;
    publish(`/app/chat.message.${streamId}`, JSON.stringify({ content }));
    setInput('');
  }

  return (
    <div className="flex h-full flex-col bg-bg2">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text">Czat na żywo</h3>
        <span className="flex items-center gap-1.5 text-[10px] text-muted">
          <span
            className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-lime' : 'bg-muted')}
          />
          {connected ? 'Połączono' : 'Łączenie…'}
        </span>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">
            Brak wiadomości. Napisz pierwszą!
          </p>
        ) : (
          messages.map((msg) => (
            <p key={msg.id} className="break-words text-sm leading-snug">
              <span
                className={cn(
                  'font-medium',
                  msg.userId === 'system' ? 'text-orange' : 'text-lime'
                )}
              >
                {msg.username}
              </span>
              <span className="mx-1.5 text-muted">·</span>
              <span className="text-text">{msg.content}</span>
            </p>
          ))
        )}
      </div>

      <div className="border-t border-border p-3">
        {isAuthenticated ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={connected ? 'Napisz wiadomość…' : 'Łączenie z czatem…'}
              disabled={!connected}
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Wyślij"
              className="rounded-lg bg-lime px-3 py-2 text-black transition-colors hover:bg-lime-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="py-1 text-center text-xs text-muted">
            <Link to="/login" className="text-lime hover:underline">
              Zaloguj się
            </Link>
            , aby pisać na czacie
          </p>
        )}
      </div>
    </div>
  );
}
