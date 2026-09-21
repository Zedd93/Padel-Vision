import { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useLatencyCompensatedEvents } from '@/hooks/useLatencyCompensatedEvents';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

interface ChatMessage {
  id: string;
  username: string;
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  streamId: string;
  /**
   * O ile opoznic cudze wiadomosci, zeby reakcje nie wyprzedzaly obrazu.
   * Wlasne wiadomosci pokazujemy od razu - czekanie 20 s na wlasny wpis
   * wygladaloby jak zepsuty czat.
   */
  delayMs?: number;
}

export default function ChatPanel({ streamId, delayMs = 0 }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { connected, subscribe, publish } = useWebSocket();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const { push: pushMessage } = useLatencyCompensatedEvents<ChatMessage>(
    delayMs,
    appendMessage
  );

  useEffect(() => {
    if (!connected) return;

    const subscription = subscribe(
      `/topic/stream.${streamId}.chat`,
      (message) => {
        try {
          const data = JSON.parse(message.body) as ChatMessage;
          // wlasne wiadomosci omijaja bufor, cudze czekaja na obraz
          if (user && data.username === user.username) {
            appendMessage(data);
          } else {
            pushMessage(data);
          }
        } catch {
          // ignore malformed messages
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, streamId, subscribe, user, appendMessage, pushMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function handleSend() {
    if (!input.trim() || !isAuthenticated || !user) return;

    const msg = {
      username: user.username,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    publish(`/app/stream.${streamId}.chat`, JSON.stringify(msg));

    // Optimistic: add the message locally
    setMessages((prev) => [
      ...prev,
      { ...msg, id: crypto.randomUUID() },
    ]);
    setInput('');
  }

  return (
    <div className="flex flex-col h-full bg-pv-surface rounded-xl border border-pv-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-pv-border">
        <h3 className="font-display text-lg text-pv-white tracking-wider">CZAT</h3>
        <p className="text-pv-muted text-xs font-body">
          {connected ? 'Połączono' : 'Łączenie...'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-pv-muted text-sm font-body text-center py-8">
            Brak wiadomości. Napisz pierwszą!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="group">
            <span className="text-pv-lime font-body text-sm font-medium">
              {msg.username}
            </span>
            <span className="text-pv-muted text-sm mx-1.5">·</span>
            <span className="text-pv-white font-body text-sm">
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-pv-border">
        {isAuthenticated ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Napisz wiadomość..."
              className="flex-1 bg-pv-surface-2 border border-pv-border rounded-lg px-3 py-2 text-pv-white text-sm font-body placeholder:text-pv-muted/50 focus:outline-none focus:border-pv-lime/40 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                'bg-pv-lime text-black rounded-lg px-3 py-2',
                'hover:brightness-110 transition-all',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-pv-muted text-sm font-body text-center py-1">
            Zaloguj się, aby pisać na czacie
          </p>
        )}
      </div>
    </div>
  );
}
