import type { CostRow } from '../data/regionData';
import { SERVICE_OPTIONS } from '../components/costos/costoData';

/**
 * Valores por defecto al aplicar una propuesta.
 * - EC2 / RDS: cobran por hora → quantity = instancias, hours = 730 (mes completo).
 * - S3: quantity = GB, hours = 1 (tarifa por GB/mes).
 * - CloudFront: quantity = GB transferidos estimados, hours = 1.
 * - Route 53: quantity = zonas hospedadas, hours = 1 (tarifa mensual fija).
 * - IAM / VPC: sin costo directo.
 *
 * Si quieres que TODO use 730 horas, cambia hours aquí.
 */
const DEFAULTS: Record<string, { quantity: number; hours: number }> = {
  EC2: { quantity: 2, hours: 730 },
  RDS: { quantity: 1, hours: 730 },
  S3: { quantity: 100, hours: 1 },
  CloudFront: { quantity: 500, hours: 1 },
  'Route 53': { quantity: 1, hours: 1 },
  IAM: { quantity: 1, hours: 1 },
  VPC: { quantity: 1, hours: 1 },
};

/** Mapeo id de servicio (planificación) → nombre en la tabla de costos. */
const ID_TO_SERVICE_NAME: Record<string, string> = {
  ec2: 'EC2',
  rds: 'RDS',
  s3: 'S3',
  cloudfront: 'CloudFront',
  route53: 'Route 53',
  iam: 'IAM',
  vpc: 'VPC',
};

/**
 * Convierte los servicios seleccionados de una propuesta en filas de la calculadora de costos.
 */
export function proposalToCostRows(selectedIds: string[]): CostRow[] {
  const rows: CostRow[] = [];
  let nextId = Date.now();

  for (const id of selectedIds) {
    const serviceName = ID_TO_SERVICE_NAME[id];
    if (!serviceName) continue;

    const opt = SERVICE_OPTIONS.find((s) => s.name === serviceName);
    if (!opt) continue;

    const defaults = DEFAULTS[serviceName] ?? { quantity: 1, hours: opt.hours };
    const quantity = defaults.quantity;
    const hours = defaults.hours;
    const rate = opt.rate;
    const monthly = +(quantity * hours * rate).toFixed(2);

    rows.push({
      id: nextId++,
      service: serviceName,
      quantity,
      hours,
      rate,
      monthly,
    });
  }

  return rows;
}

/** Validador compatible con el de Costos.tsx */
export const isCostRow = (r: unknown): r is CostRow =>
  typeof r === 'object' &&
  r !== null &&
  ['id', 'quantity', 'hours', 'rate', 'monthly'].every((k) => typeof (r as Record<string, unknown>)[k] === 'number') &&
  typeof (r as Record<string, unknown>).service === 'string';

export const isRowsByRegion = (v: unknown): v is Record<string, CostRow[]> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.values(v).every((rows) => Array.isArray(rows) && rows.every(isCostRow));