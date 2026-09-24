import { createContext } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  /** Clave opcional para evitar duplicados (p. ej. alertas por región) */
  key?: string;
  type: NotificationType;
  title: string;
  message?: string;
  createdAt: number;
  read: boolean;
}

export interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

export interface NotifyInput {
  type?: NotificationType;
  title: string;
  message?: string;
  /** Si ya existe una notificación con la misma clave, no se crea otra */
  key?: string;
  /** Mostrar también como toast (por defecto true) */
  toast?: boolean;
}

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: Toast[];
  notify: (input: NotifyInput) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  dismissToast: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);