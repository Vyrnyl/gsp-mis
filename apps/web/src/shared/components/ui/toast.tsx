'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  AlertIcon,
  CloseIcon,
  InfoIcon,
  SuccessIcon,
  type IconType,
} from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'bg-brand-green',
  error: 'bg-brand-red',
  info: 'bg-brand-blue',
};

const TONE_ICONS: Record<ToastTone, IconType> = {
  success: SuccessIcon,
  error: AlertIcon,
  info: InfoIcon,
};

const DEFAULT_DURATION_MS = 4000;

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, tone?: ToastTone, durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast host — registry §7. Replaces `#toast` / `.toast-item`.
 *
 * The stack is an `aria-live` region so async results are not silent to screen
 * readers (ui-rules.md §9), and each toast is manually dismissible rather than
 * timeout-only.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success', durationMs = DEFAULT_DURATION_MS) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current, { id, tone, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), durationMs),
      );
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>.');
  }
  return context;
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-7 right-4 z-[500] flex flex-col gap-2 md:right-7"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = TONE_ICONS[toast.tone];

  return (
    <div
      className={cn(
        'pointer-events-auto flex min-w-[220px] max-w-[min(340px,calc(100vw-2rem))] animate-slide-in',
        'items-center gap-2.5 rounded-[10px] px-5 py-3 text-[0.9rem] text-white shadow-toast',
        TONE_CLASSES[toast.tone],
      )}
    >
      <Icon className="shrink-0" aria-hidden />
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 text-white/80 transition hover:bg-white/20 hover:text-white"
      >
        <CloseIcon aria-hidden />
      </button>
    </div>
  );
}
