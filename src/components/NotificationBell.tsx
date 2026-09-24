import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useNotifications } from '../context/useNotifications';
import { notificationStyles } from './notificationStyles';

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

function timeAgo(timestamp: number) {
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  if (Math.abs(seconds) < 60) return 'ahora mismo';
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, remove, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
        aria-expanded={open}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-alerts text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-text-main">Notificaciones</p>
              <p className="text-[11px] text-text-secondary">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Marcar leídas
              </button>
              <button
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="text-text-secondary font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-text-secondary">
                <BellOff className="w-6 h-6" />
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const style = notificationStyles[n.type];
                  const Icon = style.icon;
                  return (
                    <li
                      key={n.id}
                      className={`group flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 ${
                        n.read ? '' : style.bg
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="min-w-0 flex-1 text-left"
                        aria-label={n.read ? n.title : `Marcar como leída: ${n.title}`}
                      >
                        <p className={`text-sm text-text-main ${n.read ? 'font-normal' : 'font-medium'}`}>{n.title}</p>
                        {n.message && <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>}
                        <p className="text-[11px] text-text-secondary mt-1">{timeAgo(n.createdAt)}</p>
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        aria-label="Eliminar notificación"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}