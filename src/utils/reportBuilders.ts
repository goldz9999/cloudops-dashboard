import type { SecurityReport } from '../api/security';
import { services as catalog } from '../data/mockData';
import {
  regionLabel,
  type CostRow,
  type RegionData,
  type RegionSummary,
} from '../data/regionData';
import type { ReportData } from './exportReport';

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const usdWhole = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;


function costDistribution(rows: CostRow[]) {
  const total = rows.reduce((s, r) => s + r.monthly, 0);
  const byService = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.service] = +((acc[r.service] ?? 0) + r.monthly).toFixed(2);
    return acc;
  }, {});
  return Object.entries(byService).map(([name, value]) => [
    name,
    usd(value),
    `${total ? Math.round((value / total) * 100) : 0} %`,
  ]);
}

/** Reporte de la página Costos: usa las filas actuales (incluye lo editado en la tabla). */
export function buildCostReport(region: RegionData, rows: CostRow[]): ReportData {
  const totalMonthly = rows.reduce((s, r) => s + r.monthly, 0);
  const highest = rows.length ? rows.reduce((max, r) => (r.monthly > max.monthly ? r : max), rows[0]) : null;

  return {
    title: 'Reporte de costos',
    slug: 'costos',
    regionId: region.id,
    regionText: regionLabel(region),
    kpis: [
      { label: 'Costo mensual', value: usd(totalMonthly) },
      { label: 'Costo anual', value: usdWhole(totalMonthly * 12) },
      { label: 'Servicios utilizados', value: String(rows.length) },
      { label: 'Recurso de mayor costo', value: highest?.service ?? '—' },
    ],
    sections: [
      {
        title: 'Detalle de costos',
        columns: ['Servicio', 'Cantidad', 'Horas', 'Tarifa (USD/h)', 'Costo mensual', 'Costo anual'],
        rows: rows.map((r) => [r.service, r.quantity, r.hours, r.rate, usd(r.monthly), usd(r.monthly * 12)]),
      },
      {
        title: 'Distribución de costos',
        columns: ['Servicio', 'Costo mensual', '% del total'],
        rows: costDistribution(rows),
      },
    ],
  };
}

export function buildDashboardReport(region: RegionData, summary: RegionSummary): ReportData {
  return {
    title: 'Resumen de la infraestructura Cloud',
    slug: 'dashboard',
    regionId: region.id,
    regionText: regionLabel(region),
    kpis: [
      { label: 'Servicios utilizados', value: String(summary.servicesUsed) },
      { label: 'Recursos Cloud', value: String(summary.cloudResources) },
      { label: 'Costo mensual', value: usd(summary.monthlyCost) },
      { label: 'Costo anual', value: usdWhole(summary.annualCost) },
      { label: 'Seguridad', value: `${region.securityScore} %` },
      { label: 'Disponibilidad', value: `${region.availability} %` },
    ],
    sections: [
      {
        title: 'Distribución de costos',
        columns: ['Servicio', 'Costo mensual', '% del total'],
        rows: summary.costDistribution.map((c) => [c.name, usd(c.value), `${c.percentage} %`]),
      },
      {
        title: 'Servicios',
        columns: ['Servicio', 'Categoría', 'Estado', 'Recursos', 'Uso'],
        rows: catalog.map((svc) => {
          const m = region.serviceMetrics[svc.id];
          const inUse = m?.status === 'in-use';
          return [svc.name, svc.category, inUse ? 'En uso' : 'Disponible', inUse ? m.resources : '—', inUse ? `${m.usage} %` : '—'];
        }),
      },
    ],
  };
}

export function buildSecurityReport(region: RegionData, report?: SecurityReport | null): ReportData {
  const label: Record<string, string> = { healthy: 'Correcto', review: 'Revisar', issue: 'Problema', unknown: 'Sin datos' };
  return {
    title: 'Reporte de seguridad',
    slug: 'seguridad',
    regionId: region.id,
    regionText: regionLabel(region),
    kpis: [{ label: 'Puntaje de seguridad', value: report && report.score > 0 ? `${report.score} %` : 'Sin datos' }],
    sections: (report?.groups ?? []).map((g) => ({
      title: g.label,
      columns: ['Control', 'Estado', 'Detalle'],
      rows: g.checks.map((c) => [c.label, label[c.status], c.detail]),
    })),
  };
}