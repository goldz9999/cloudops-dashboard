import { useEffect, useRef } from 'react';
import { useRegion } from '../context/useRegion';
import { useNotifications } from '../context/useNotifications';
import { regionLabel } from '../data/regionData';
import { services as catalog } from '../data/mockData';

const USAGE_ALERT_THRESHOLD = 80;

/**
 * No renderiza nada: genera las notificaciones que dependen de la región.
 * - Alertas (estado de la región y servicios con uso alto): solo en el panel de la campana.
 * - Aviso al cambiar de región: toast + panel.
 */
export default function RegionNotifier() {
  const { region } = useRegion();
  const { notify } = useNotifications();
  const previousRegionId = useRef<string | null>(null);

  useEffect(() => {
    if (region.status === 'issue') {
      notify({
        type: 'error',
        key: `alert:${region.id}:status`,
        title: `Problema en ${region.name}`,
        message: `La región ${region.id} reporta incidencias. Revisa su estado.`,
        toast: false,
      });
    } else if (region.status === 'review') {
      notify({
        type: 'warning',
        key: `alert:${region.id}:status`,
        title: `${region.name} en revisión`,
        message: `La región ${region.id} está en revisión.`,
        toast: false,
      });
    }

    for (const [serviceId, metric] of Object.entries(region.serviceMetrics)) {
      if (metric.status !== 'in-use' || metric.usage < USAGE_ALERT_THRESHOLD) continue;
      const name = catalog.find((s) => s.id === serviceId)?.name ?? serviceId;
      notify({
        type: 'warning',
        key: `alert:${region.id}:usage:${serviceId}`,
        title: `${name} al ${metric.usage} % de uso`,
        message: `Uso alto en ${region.id}.`,
        toast: false,
      });
    }
  }, [region, notify]);

  useEffect(() => {
    if (previousRegionId.current !== null && previousRegionId.current !== region.id) {
      notify({
        type: 'info',
        title: 'Región cambiada',
        message: `Ahora ves ${region.id} — ${regionLabel(region)}.`,
      });
    }
    previousRegionId.current = region.id;
  }, [region, notify]);

  return null;
}