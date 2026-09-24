import { useContext } from 'react';
import { NotificationContext } from './notificationContextValue';

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationProvider>');
  return ctx;
}