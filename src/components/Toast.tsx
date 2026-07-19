import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number; // ms
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = crypto.randomUUID();
      const toast: ToastMessage = { id, message, type, duration: 3000 };
      setToasts((prev) => [...prev, toast]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export { ToastContainer };

// ---------------------------------------------------------------------------
// Toast Item
// ---------------------------------------------------------------------------

const ICON_MAP: Record<
  ToastMessage['type'],
  React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const BORDER_COLOR_MAP: Record<ToastMessage['type'], string> = {
  success: 'var(--color-best)',
  error: 'var(--color-blunder)',
  info: 'var(--color-accent)',
};

const ICON_COLOR_MAP: Record<ToastMessage['type'], string> = {
  success: 'var(--color-best)',
  error: 'var(--color-blunder)',
  info: 'var(--color-accent)',
};

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { id, message, type, duration } = toast;
  const Icon = ICON_MAP[type];

  // Track remaining time so we can pause on hover
  const remainingRef = useRef(duration);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(duration);
  // Progress goes from 1 → 0
  const [progress, setProgress] = useState(1);
  const rafRef = useRef<number | null>(null);

  // ---- tick progress bar ----
  const tickProgress = useCallback(function tick() {
    if (remainingRef.current <= 0) return;
    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, remainingRef.current - elapsed);
    setProgress(remaining / duration);
    if (remaining > 0) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [duration]);

  // ---- schedule auto-dismiss ----
  const scheduleTimer = useCallback(() => {
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onRemove(id);
    }, remainingRef.current);
    rafRef.current = requestAnimationFrame(tickProgress);
  }, [id, onRemove, tickProgress]);

  // ---- pause ----
  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const nextRemaining = Math.max(
      0,
      remainingRef.current - (Date.now() - startRef.current),
    );
    remainingRef.current = nextRemaining;
    setRemainingTime(nextRemaining);
    setPaused(true);
  }, []);

  // ---- resume ----
  const resumeTimer = useCallback(() => {
    setPaused(false);
    scheduleTimer();
  }, [scheduleTimer]);

  // Start timer on mount
  useEffect(() => {
    scheduleTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      role="status"
      aria-atomic
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      className="glass-subtle pointer-events-auto relative min-w-[250px] max-w-[350px] overflow-hidden rounded-lg py-3 px-4 shadow-lg"
      style={{ borderLeft: `4px solid ${BORDER_COLOR_MAP[type]}` }}
    >
      {/* Content */}
      <div className="flex items-start gap-3">
        <Icon
          size={18}
          className="mt-0.5 shrink-0"
          style={{ color: ICON_COLOR_MAP[type] }}
        />
        <p className="text-sm text-text leading-snug flex-1">{message}</p>
        <button
          onClick={() => onRemove(id)}
          className="shrink-0 mt-0.5 text-text-tertiary hover:text-text transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border-subtle">
        <motion.div
          className="h-full origin-left"
          style={{
            backgroundColor: BORDER_COLOR_MAP[type],
            opacity: 0.6,
            scaleX: progress,
          }}
          animate={{ scaleX: paused ? progress : 0 }}
          transition={
            paused
              ? { duration: 0 }
              : { duration: remainingTime / 1000, ease: 'linear' }
          }
        />
      </div>
    </motion.div>
  );
}
