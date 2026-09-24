import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  NotificationContext,
  type AppNotification,
  type NotifyInput,
  type Toast,
} from './notificationContextValue';

const MAX_NOTIFICATIONS = 50;
const MAX_TOASTS = 4;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const notify = useCallback((input: NotifyInput) => {
    counter.current += 1;
    const id = `n-${Date.now()}-${counter.current}`;
    const type = input.type ?? 'info';

    const notification: AppNotification = {
      id,
      key: input.key,
      type,
      title: input.title,
      message: input.message,
      createdAt: Date.now(),
      read: false,
    };

    // La comprobación de duplicados va dentro del updater para que sea fiable
    // aunque React ejecute el efecto dos veces (StrictMode).
    setNotifications((prev) =>
      input.key && prev.some((n) => n.key === input.key)
        ? prev
        : [notification, ...prev].slice(0, MAX_NOTIFICATIONS)
    );

    if (input.toast ?? true) {
      setToasts((prev) => [...prev, { id, type, title: input.title, message: input.message }].slice(-MAX_TOASTS));
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      toasts,
      notify,
      markAsRead,
      markAllAsRead,
      remove,
      clearAll,
      dismissToast,
    }),
    [notifications, toasts, notify, markAsRead, markAllAsRead, remove, clearAll, dismissToast]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}