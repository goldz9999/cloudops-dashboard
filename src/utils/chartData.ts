import type { RegionData } from '../data/regionData';

/** Color fijo por servicio para que sea consistente en todos los gráficos */
export const SERVICE_COLORS: Record<string, string> = {
  EC2: '#2563EB',
  RDS: '#F59E0B',
  S3: '#16A34A',
  CloudFront: '#8B5CF6',
  'Route 53': '#64748B',
  VPC: '#0EA5E9',
  IAM: '#EF4444',
};
export const colorFor = (name: string) => SERVICE_COLORS[name] ?? '#94A3B8';

export interface TrendRow {
  month: string;
  fullLabel: string;
  total: number;
  [service: string]: number | string;
}

export interface CostTrend {
  services: string[];
  rows: TrendRow[];
}

/** Costo mensual por servicio (suma de filas repetidas). */
export function costByService(region: RegionData) {
  const map = new Map<string, number>();
  region.costTable.forEach((c) => map.set(c.service, +((map.get(c.service) ?? 0) + c.monthly).toFixed(2)));
  return Array.from(map, ([name, value]) => ({ name, value }));
}

/**
 * Evolución del costo de los últimos meses. El último mes coincide exactamente con el
 * costo actual de la región; los anteriores salen de `region.costTrend` con una
 * pequeña variación determinista por servicio (sin números aleatorios).
 */
export function buildCostTrend(region: RegionData, now: Date = new Date()): CostTrend {
  const base = costByService(region);
  const n = region.costTrend.length;
  const rows = region.costTrend.map((factor, i): TrendRow => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    const row: TrendRow = {
      month: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').slice(0, 3),
      fullLabel: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      total: 0,
    };
    let total = 0;
    base.forEach((svc, si) => {
      const noise = i === n - 1 ? 0 : (((si * 7 + i * 3) % 5) - 2) * 0.012;
      const v = +(svc.value * factor * (1 + noise)).toFixed(2);
      row[svc.name] = v;
      total += v;
    });
    row.total = +total.toFixed(2);
    return row;
  });
  return { services: base.map((b) => b.name), rows };
}

/** Porcentaje de uso de los servicios desplegados en la región. */
export function buildUsageData(region: RegionData, catalog: { id: string; name: string }[]) {
  return catalog
    .filter((s) => region.serviceMetrics[s.id]?.status === 'in-use')
    .map((s) => ({
      name: s.name,
      usage: region.serviceMetrics[s.id].usage,
      resources: region.serviceMetrics[s.id].resources,
    }));
}
