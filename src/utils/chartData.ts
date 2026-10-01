import type { Proposal } from '../components/planificacion/planTypes';
import { SERVICE_OPTIONS } from '../components/costos/costoData';

/**
 * Datos de los gráficos del Dashboard, calculados SOLO a partir de las
 * planificaciones guardadas en la base de datos (Supabase). No hay valores
 * simulados ni factores de tendencia inventados.
 */

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

/** Id de servicio (planificación) → nombre en la tabla de tarifas. */
const ID_TO_SERVICE_NAME: Record<string, string> = {
  ec2: 'EC2',
  rds: 'RDS',
  s3: 'S3',
  cloudfront: 'CloudFront',
  route53: 'Route 53',
  iam: 'IAM',
  vpc: 'VPC',
};

export interface ServiceCost {
  service: string;
  monthly: number;
}

/** Costo mensual de un servicio seleccionado (misma tarifa que "Aplicar a costos": cantidad 1). */
export function serviceCost(selected: string): ServiceCost | null {
  const name = ID_TO_SERVICE_NAME[selected.toLowerCase()] ?? selected;
  const opt = SERVICE_OPTIONS.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (!opt) return null;
  return { service: opt.name, monthly: +(opt.rate * opt.hours).toFixed(2) };
}

const costsOf = (p: Proposal): ServiceCost[] =>
  (p.selected ?? []).map(serviceCost).filter((c): c is ServiceCost => c !== null);

/** Orden estable de servicios (el de la tabla de tarifas) para apilar y colorear igual siempre. */
const ORDER = SERVICE_OPTIONS.map((s) => s.name);
const byOrder = (a: string, b: string) => ORDER.indexOf(a) - ORDER.indexOf(b);

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

/** Costo mensual actual por servicio (suma de todas las planificaciones). Excluye servicios sin costo. */
export function costByService(proposals: Proposal[]) {
  const map = new Map<string, number>();
  for (const p of proposals) {
    for (const c of costsOf(p)) map.set(c.service, +((map.get(c.service) ?? 0) + c.monthly).toFixed(2));
  }
  return [...map]
    .filter(([, v]) => v > 0)
    .sort(([a], [b]) => byOrder(a, b))
    .map(([name, value]) => ({ name, value }));
}

const monthStart = (d: Date, offset = 0) => new Date(d.getFullYear(), d.getMonth() + offset, 1);

/**
 * Evolución del costo mensual planificado, mes a mes (últimos `maxMonths`).
 * Cada punto es la suma de las planificaciones que ya existían al cierre de ese mes
 * (según su fecha real de creación `created_at`). El último mes coincide con el costo actual.
 */
export function buildCostTrend(proposals: Proposal[], now: Date = new Date(), maxMonths = 6): CostTrend {
  const dated = proposals
    .map((p) => ({ at: p.createdAtIso ? new Date(p.createdAtIso) : now, costs: costsOf(p) }))
    .filter((x) => !Number.isNaN(x.at.getTime()));
  const services = costByService(proposals).map((s) => s.name);
  if (!dated.length || !services.length) return { services: [], rows: [] };

  const first = new Date(Math.min(...dated.map((x) => x.at.getTime())));
  let start = monthStart(first);
  const earliest = monthStart(now, -(maxMonths - 1));
  if (start < earliest) start = earliest;

  let n = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  // Con un solo mes de historia se añade el mes previo (costo real = 0: aún no había planificaciones)
  if (n < 2) {
    start = monthStart(start, -1);
    n = 2;
  }

  const rows = Array.from({ length: n }, (_, i): TrendRow => {
    const d = monthStart(start, i);
    const end = monthStart(d, 1);
    const row: TrendRow = {
      month: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').slice(0, 3),
      fullLabel: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      total: 0,
    };
    const acc = new Map<string, number>();
    for (const x of dated) {
      if (x.at >= end) continue;
      for (const c of x.costs) acc.set(c.service, (acc.get(c.service) ?? 0) + c.monthly);
    }
    let total = 0;
    for (const s of services) {
      const v = +(acc.get(s) ?? 0).toFixed(2);
      row[s] = v;
      total += v;
    }
    row.total = +total.toFixed(2);
    return row;
  });
  return { services, rows };
}

/**
 * Cambio porcentual entre el primer mes con costo y el último. `null` si aún no hay
 * al menos dos meses de historial con costo.
 */
export function trendChange(rows: TrendRow[]): { pct: number; months: number } | null {
  const firstIdx = rows.findIndex((r) => r.total > 0);
  if (firstIdx < 0 || firstIdx >= rows.length - 1) return null;
  const first = rows[firstIdx].total;
  const last = rows[rows.length - 1].total;
  return { pct: Math.round(((last - first) / first) * 100), months: rows.length - 1 - firstIdx };
}

export interface UsageRow {
  name: string;
  /** % de planificaciones de la región que incluyen el servicio */
  usage: number;
  /** Nº de planificaciones que lo incluyen */
  plans: number;
  /** Total de planificaciones de la región */
  total: number;
}

/**
 * Adopción de cada servicio: porcentaje de las planificaciones de la región que lo incluyen.
 * (El uso real de CPU/almacenamiento solo existe con una cuenta AWS conectada.)
 */
export function buildUsageData(proposals: Proposal[]): UsageRow[] {
  const total = proposals.length;
  if (!total) return [];
  const acc = new Map<string, number>();
  for (const p of proposals) {
    for (const s of new Set(costsOf(p).map((c) => c.service))) acc.set(s, (acc.get(s) ?? 0) + 1);
  }
  return [...acc]
    .sort(([a], [b]) => byOrder(a, b))
    .map(([name, plans]) => ({ name, plans, total, usage: Math.round((plans / total) * 100) }));
}