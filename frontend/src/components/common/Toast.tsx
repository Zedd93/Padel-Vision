import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLE_MAP = {
  success: 'bg-pv-lime/15 border-pv-lime/30 text-pv-lime',
  error: 'bg-pv-red/15 border-pv-red/30 text-pv-red',
  info: 'bg-pv-surface-2 border-pv-border text-pv-white',
};

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onRemove: (id: string) => void;
}

function ToastItem({ id, message, type, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const Icon = ICON_MAP[type];

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Start leave animation before auto-dismiss
    const leaveTimer = setTimeout(() => setIsLeaving(true), 3500);
    return () => clearTimeout(leaveTimer);
  }, []);

  useEffect(() => {
    if (isLeaving) {
      const removeTimer = setTimeout(() => onRemove(id), 300);
      return () => clearTimeout(removeTimer);
    }
  }, [isLeaving, id, onRemove]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg max-w-sm transition-all duration-300',
        STYLE_MAP[type],
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-8 opacity-0'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="font-body text-sm flex-1">{message}</p>
      <button
        onClick={() => setIsLeaving(true)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Toast() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}
