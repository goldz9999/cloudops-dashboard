import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';
import type { NotificationType } from '../context/notificationContextValue';

export const notificationStyles: Record<
  NotificationType,
  { icon: typeof Info; text: string; bar: string; bg: string }
> = {
  info: { icon: Info, text: 'text-primary', bar: 'bg-primary', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  success: { icon: CheckCircle2, text: 'text-security', bar: 'bg-security', bg: 'bg-green-50 dark:bg-green-500/10' },
  warning: { icon: AlertTriangle, text: 'text-costs', bar: 'bg-costs', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  error: { icon: XCircle, text: 'text-alerts', bar: 'bg-alerts', bg: 'bg-red-50 dark:bg-red-500/10' },
};