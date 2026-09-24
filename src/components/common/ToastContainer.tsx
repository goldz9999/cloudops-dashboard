import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useNotifications } from '../../context/useNotifications';
import type { Toast } from '../../context/notificationContextValue';
import { notificationStyles } from './notificationStyles';

const TOAST_DURATION_MS = 4500;

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const style = notificationStyles[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    const timer = window.setTimeout(onClose, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="relative flex items-start gap-3 w-full bg-card border border-border rounded-lg shadow-lg pl-4 pr-3 py-3 overflow-hidden pointer-events-auto animate-toast-in">
      <span className={`absolute left-0 inset-y-0 w-1 ${style.bar}`} />
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-main">{toast.title}</p>
        {toast.message && <p className="text-xs text-text-secondary mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-80 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}