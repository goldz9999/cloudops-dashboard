import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { readStorage, writeStorage } from '../utils/storage';
import {
  NotificationContext,
  type AppNotification,
  type NotifyInput,
  type Toast,
} from './notificationContextValue';

const MAX_NOTIFICATIONS = 50;
const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'];

const isNotificationList = (v: unknown): v is AppNotification[] =>
  Array.isArray(v) &&
  v.every(
    (n) =>
      typeof n === 'object' &&
      n !== null &&
      typeof n.id === 'string' &&
      NOTIFICATION_TYPES.includes(n.type) &&
      typeof n.title === 'string' &&
      typeof n.createdAt === 'number' &&
      typeof n.read === 'boolean'
  );

/** Las alertas automáticas de región (clave "alert:…") no se guardan: se regeneran al abrir la app. */
const isAutoAlert = (n: AppNotification) => n.key?.startsWith('alert:') ?? false;
const MAX_TOASTS = 4;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    readStorage('notifications', [], isNotificationList)
  );
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

  useEffect(() => {
    writeStorage('notifications', notifications.filter((n) => !isAutoAlert(n)));
  }, [notifications]);

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