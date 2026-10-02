import {
  Server,
  DollarSign,
  Shield,
  Activity,
  Globe2,
  Cloud,
  Database,
  ArrowRight,
  Network,
  RefreshCw,
  Loader2,
  ClipboardList,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { services } from '../data/mockData';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRegion } from '../context/useRegion';
import { archiveRegionProposals, fetchArchivedCounts, fetchProposals, restoreRegionProposals } from '../api/proposals';
import { useNotifications } from '../context/useNotifications';
import type { Proposal } from '../components/planificacion/planTypes';
import { fetchSecurityReport, type SecurityReport } from '../api/security';
import { serviceCost } from '../utils/chartData';
import RegionSelector from '../components/common/RegionSelector';
import InteractiveChart from '../components/dashboard/InteractiveChart';
import ExportMenu from '../components/common/ExportMenu';
import type { ReportData } from '../utils/exportReport';
import { regionLabel, regionStatusLabel, type HealthStatus } from '../data/regionData';

const COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#8B5CF6', '#64748B', '#EC4899', '#14B8A6'];

const statusColor = {
  operational: 'bg-security',
  review: 'bg-costs',
  issue: 'bg-alerts',
};

const healthText: Record<HealthStatus, string> = { healthy: 'Saludable', review: 'Revisar', issue: 'Problema' };
const healthColor: Record<HealthStatus, string> = {
  healthy: 'text-security',
  review: 'text-costs',
  issue: 'text-alerts',
};
const statusBadgeCls = {
  operational: 'bg-green-50 dark:bg-green-500/10 text-security border-green-100 dark:border-green-500/30',
  review: 'bg-amber-50 dark:bg-amber-500/10 text-costs border-amber-100 dark:border-amber-500/30',
  issue: 'bg-red-50 dark:bg-red-500/10 text-alerts border-red-100 dark:border-red-500/30',
};

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pct = (n: number | null) => (n === null ? '—' : `${n}%`);

interface PlanSummary {
  id: number;
  name: string;
  type: string;
  createdAt: string;
  services: string[];
  monthly: number;
}

export default function Dashboard() {
  const { region, regionId, regions, setRegionId, openRegionsModal } = useRegion();
  const { notify } = useNotifications();

  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [security, setSecurity] = useState<SecurityReport | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());
  const [archivedCounts, setArchivedCounts] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState<'clean' | 'restore' | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [props, sec, archived] = await Promise.all([
        fetchProposals(),
        // la seguridad es secundaria: si falla no rompe el resto del dashboard
        fetchSecurityReport(regionId).catch(() => null),
        // el archivo también es secundario: si falla solo se oculta el botón Restaurar
        fetchArchivedCounts().catch(() => ({}) as Record<string, number>),
      ]);
      setAllProposals(props);
      setSecurity(sec);
      setArchivedCounts(archived);
      setUpdatedAt(new Date());
    } catch (e) {
      setAllProposals([]);
      setSecurity(null);
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el backend');
    } finally {
      setLoading(false);
    }
  }, [regionId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Solo las planificaciones de la región seleccionada (todas, no solo la última aplicada)
  const regionProposals = useMemo(() => allProposals.filter((p) => p.regionId === regionId), [allProposals, regionId]);

  const plans = useMemo<PlanSummary[]>(
    () =>
      regionProposals
        .map((p) => {
          const costs = (p.selected ?? []).map(serviceCost).filter((c): c is { service: string; monthly: number } => c !== null);
          return {
            id: p.id,
            name: p.name,
            type: p.type,
            createdAt: p.createdAt,
            services: costs.map((c) => c.service),
            monthly: +costs.reduce((s, c) => s + c.monthly, 0).toFixed(2),
          };
        }),
    [regionProposals],
  );

  const hasPlanning = plans.length > 0;
  const archivedInRegion = archivedCounts[regionId] ?? 0;

  const runCleanup = async () => {
    const action = confirm;
    if (!action) return;
    setBusy(true);
    try {
      if (action === 'clean') {
        const moved = await archiveRegionProposals(regionId);
        notify({
          type: 'success',
          title: 'Datos limpiados',
          message: `${moved} ${moved === 1 ? 'planificación archivada' : 'planificaciones archivadas'} de ${regionId}. Puedes restaurarlas cuando quieras.`,
        });
      } else {
        const restored = await restoreRegionProposals(regionId);
        notify({
          type: 'success',
          title: 'Datos restaurados',
          message: `${restored} ${restored === 1 ? 'planificación recargada' : 'planificaciones recargadas'} en ${regionId}.`,
        });
      }
      setConfirm(null);
      await load();
    } catch (e) {
      notify({
        type: 'error',
        title: action === 'clean' ? 'No se pudo limpiar' : 'No se pudo restaurar',
        message: e instanceof Error ? e.message : 'Error de conexión con el backend',
      });
    } finally {
      setBusy(false);
    }
  };

  // Por servicio: cuántas planificaciones lo usan y cuánto cuesta en total
  const byService = useMemo(() => {
    const acc = new Map<string, { service: string; count: number; monthly: number }>();
    for (const p of regionProposals) {
      for (const sel of p.selected ?? []) {
        const c = serviceCost(sel);
        if (!c) continue;
        const cur = acc.get(c.service) ?? { service: c.service, count: 0, monthly: 0 };
        cur.count += 1;
        cur.monthly = +(cur.monthly + c.monthly).toFixed(2);
        acc.set(c.service, cur);
      }
    }
    return acc;
  }, [regionProposals]);

  const isUp = (name: string) => byService.has(name);

  const monthlyCost = +plans.reduce((s, p) => s + p.monthly, 0).toFixed(2);
  const annualCost = Math.round(monthlyCost * 12);

  const costDistribution = useMemo(() => {
    const list = [...byService.values()].filter((s) => s.monthly > 0).sort((a, b) => b.monthly - a.monthly);
    const total = list.reduce((s, x) => s + x.monthly, 0) || 1;
    return list.map((s) => ({ name: s.service, value: s.monthly, percentage: Math.round((s.monthly / total) * 100) }));
  }, [byService]);

  const securityMeasured = security?.awsConnected === true; // IAM / MFA / datos: requieren AWS
  const scoreMeasured = (security?.score ?? 0) > 0; // el puntaje se calcula con datos reales
  const kpiData = {
    planificaciones: plans.length,
    servicesUsed: byService.size,
    cloudResources: [...byService.values()].reduce((s, x) => s + x.count, 0),
    monthlyCost,
    annualCost,
    // Solo se muestra lo que el backend mide de verdad (puntaje > 0 = cuenta AWS conectada).
    securityScore: scoreMeasured ? security!.score : (null as number | null),
    // Sin cuenta AWS no existe una fuente real de disponibilidad: no se inventa.
    availability: null as number | null,
  };

  // IAM / MFA / datos solo tienen valor real con AWS conectado; el cumplimiento viene de la BD (manual).
  const secStatus = (st?: HealthStatus, labels: Record<HealthStatus, string> = healthText) =>
    securityMeasured && st ? { status: labels[st], color: healthColor[st] } : { status: 'Sin evaluar', color: 'text-text-secondary' };
  const complianceStatus = (() => {
    const list = security?.compliance ?? [];
    if (!list.length) return { status: 'Sin evaluar', color: 'text-text-secondary' };
    const st: HealthStatus = list.some((c) => c.status === 'issue')
      ? 'issue'
      : list.every((c) => c.status === 'healthy')
        ? 'healthy'
        : 'review';
    return { status: healthText[st], color: healthColor[st] };
  })();

  const otherRegions = [region, ...regions.filter((r) => r.id !== region.id)].slice(0, 3);
  const updatedLabel = updatedAt.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

  const getReport = (): ReportData => ({
    title: 'Resumen de la infraestructura Cloud',
    slug: 'dashboard',
    regionId: region.id,
    regionText: regionLabel(region),
    kpis: [
      { label: 'Planificaciones', value: String(kpiData.planificaciones) },
      { label: 'Servicios utilizados', value: String(kpiData.servicesUsed) },
      { label: 'Recursos Cloud', value: String(kpiData.cloudResources) },
      { label: 'Costo mensual', value: usd(kpiData.monthlyCost) },
      { label: 'Costo anual', value: `$${kpiData.annualCost.toLocaleString('en-US')}` },
      { label: 'Seguridad', value: pct(kpiData.securityScore) },
      { label: 'Disponibilidad', value: pct(kpiData.availability) },
    ],
    sections: [
      {
        title: 'Planificaciones de la región',
        columns: ['Nombre', 'Tipo', 'Servicios', 'Costo mensual'],
        rows: plans.map((p) => [p.name, p.type, p.services.join(', ') || '—', usd(p.monthly)]),
      },
      {
        title: 'Distribución de costos',
        columns: ['Servicio', 'Costo mensual', '% del total'],
        rows: costDistribution.map((c) => [c.name, usd(c.value), `${c.percentage} %`]),
      },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Resumen de la Infraestructura Cloud</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Planificaciones de{' '}
            <span className="font-medium text-text-main">
              {region.id} — {regionLabel(region)}
            </span>
            {' · '}
            {plans.length} {plans.length === 1 ? 'planificación' : 'planificaciones'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
          <span className="px-2.5 py-1 rounded-md bg-card border border-border max-w-full">
            <RegionSelector />
          </span>
          <span className={`px-2.5 py-1 rounded-md font-medium border ${statusBadgeCls[region.status]}`}>
            Estado: {regionStatusLabel[region.status]}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-card border border-border">Actualizado: {updatedLabel}</span>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border text-text-main hover:border-primary transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Actualizar
          </button>
          <button
            onClick={() => setConfirm('clean')}
            disabled={loading || busy || !hasPlanning}
            title={hasPlanning ? 'Archivar las planificaciones de esta región' : 'No hay planificaciones para limpiar'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border text-text-main hover:border-alerts hover:text-alerts transition-colors disabled:opacity-50 disabled:hover:border-border disabled:hover:text-text-main"
          >
            <Archive className="w-3.5 h-3.5" />
            Limpiar datos
          </button>
          {archivedInRegion > 0 && (
            <button
              onClick={() => setConfirm('restore')}
              disabled={loading || busy}
              title="Volver a cargar las planificaciones archivadas de esta región"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border text-text-main hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
              Restaurar ({archivedInRegion})
            </button>
          )}
          <ExportMenu getReport={getReport} />
        </div>
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && setConfirm(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-card border border-border rounded-xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              {confirm === 'clean' ? (
                <Archive className="w-5 h-5 text-alerts" />
              ) : (
                <ArchiveRestore className="w-5 h-5 text-primary" />
              )}
              <h3 className="text-base font-semibold text-text-main">
                {confirm === 'clean' ? 'Limpiar datos del Dashboard' : 'Restaurar datos archivados'}
              </h3>
            </div>
            <p className="text-sm text-text-secondary">
              {confirm === 'clean' ? (
                <>
                  Las <strong className="text-text-main">{plans.length}</strong>{' '}
                  {plans.length === 1 ? 'planificación' : 'planificaciones'} de{' '}
                  <strong className="text-text-main">{region.id}</strong> dejarán de verse en el Dashboard. No se borran:
                  se guardan en el archivo y puedes recargarlas con «Restaurar».
                </>
              ) : (
                <>
                  Se volverán a cargar <strong className="text-text-main">{archivedInRegion}</strong>{' '}
                  {archivedInRegion === 1 ? 'planificación archivada' : 'planificaciones archivadas'} de{' '}
                  <strong className="text-text-main">{region.id}</strong>.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={busy}
                className="px-3 py-1.5 rounded-md border border-border text-sm text-text-main hover:border-slate-400 transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => void runCleanup()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {confirm === 'clean' ? 'Limpiar' : 'Restaurar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 text-alerts rounded-xl p-4 text-sm">
          No se pudieron cargar las planificaciones: {error}
        </div>
      )}

      {!loading && !error && !hasPlanning && (
        <div className="bg-card border border-border rounded-xl p-5 text-sm text-text-secondary">
          No hay planificaciones en esta región. En <strong>Planificación</strong> crea una propuesta para{' '}
          <strong>{region.id}</strong> y aparecerá aquí.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { label: 'Planificaciones', value: kpiData.planificaciones, icon: ClipboardList, color: 'text-primary' },
          { label: 'Servicios utilizados', value: kpiData.servicesUsed, icon: Cloud, color: 'text-primary' },
          { label: 'Recursos Cloud', value: kpiData.cloudResources, icon: Server, color: 'text-primary' },
          { label: 'Costo mensual', value: usd(kpiData.monthlyCost), icon: DollarSign, color: 'text-costs' },
          { label: 'Costo anual', value: `$${kpiData.annualCost.toLocaleString()}`, icon: DollarSign, color: 'text-costs' },
          { label: 'Seguridad', value: pct(kpiData.securityScore), icon: Shield, color: 'text-security' },
          { label: 'Disponibilidad', value: pct(kpiData.availability), icon: Activity, color: 'text-security' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow min-w-0"
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-semibold text-text-main truncate">{kpi.value}</p>
              <p className="text-xs text-text-secondary">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Planificaciones de la región */}
      <div className="bg-card rounded-xl border border-border p-5 min-w-0">
        <h2 className="text-sm font-semibold text-text-main mb-1">Planificaciones de la región</h2>
        <p className="text-xs text-text-secondary mb-4">
          Todas las propuestas creadas para {region.id}; el total es la suma de cada una
        </p>
        {plans.length === 0 ? (
          <p className="text-xs text-text-secondary">Sin planificaciones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-secondary">
                  <th className="pb-2 font-medium">Nombre</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Servicios</th>
                  <th className="pb-2 font-medium text-right">Costo/mes</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium text-text-main">{p.name}</td>
                    <td className="py-2.5 text-text-secondary">{p.type}</td>
                    <td className="py-2.5 text-text-secondary text-xs">{p.services.join(', ') || '—'}</td>
                    <td className="py-2.5 text-right font-medium text-text-main tabular-nums">{usd(p.monthly)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={3} className="pt-3 text-right text-sm font-medium text-text-secondary">
                    Total mensual
                  </td>
                  <td className="pt-3 text-right text-sm font-semibold text-text-main tabular-nums">
                    {usd(kpiData.monthlyCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Cost Analysis */}
        <div className="xl:col-span-1 bg-card rounded-xl border border-border p-5 min-w-0">
          <h2 className="text-sm font-semibold text-text-main mb-1">Análisis de Costos</h2>
          <p className="text-xs text-text-secondary mb-4">Distribución mensual por servicio</p>
          <div className="h-52">
            {costDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary">
                Sin costos para mostrar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {costDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Costo']}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-card)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 pt-3 border-t border-border flex justify-between text-sm">
            <span className="text-text-secondary">Total mensual</span>
            <span className="font-semibold text-text-main">{usd(kpiData.monthlyCost)}</span>
          </div>
        </div>

        {/* Security Status */}
        <div className="xl:col-span-1 bg-card rounded-xl border border-border p-5 min-w-0">
          <h2 className="text-sm font-semibold text-text-main mb-1">Estado de Seguridad</h2>
          <p className="text-xs text-text-secondary mb-4">Resumen de postura de seguridad</p>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="3"
                  strokeDasharray={`${kpiData.securityScore ?? 0}, 100`}
                  className="transition-[stroke-dasharray] duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${securityMeasured ? 'text-security' : 'text-text-secondary'}`}>
                  {pct(kpiData.securityScore)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-main">Seguridad general</p>
              <p className="text-xs text-text-secondary">
                {securityMeasured
                  ? 'Puntuación basada en IAM, MFA y protección de datos'
                  : 'Sin medir: requiere conectar una cuenta AWS'}
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'IAM', ...secStatus(security?.summary.iam) },
              {
                label: 'MFA',
                ...secStatus(
                  security?.summary.mfa,
                  { healthy: 'Habilitado', review: 'Parcial', issue: 'Deshabilitado' },
                ),
              },
              { label: 'Protección de datos', ...secStatus(security?.summary.dataProtection) },
              { label: 'Cumplimiento', ...complianceStatus },
              { label: 'Modelo responsabilidad', status: 'Documentado', color: 'text-primary' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className={`font-medium ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Infrastructure */}
        <div className="xl:col-span-1 bg-card rounded-xl border border-border p-5 min-w-0">
          <h2 className="text-sm font-semibold text-text-main mb-1">Infraestructura Global</h2>
          <p className="text-xs text-text-secondary mb-4">Regiones configuradas ({regions.length})</p>
          <div className="space-y-3">
            {otherRegions.map((r) => {
              const count = allProposals.filter((p) => p.regionId === r.id).length;
              return (
                <button
                  key={r.id}
                  onClick={() => setRegionId(r.id)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-colors ${r.id === region.id
                    ? 'bg-blue-50/60 dark:bg-blue-500/10 border-primary'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-border hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor[r.status]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-main truncate">{r.name}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {r.location} · {count} {count === 1 ? 'planificación' : 'planificaciones'}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                    {r.id === region.id ? 'Actual' : regionStatusLabel[r.status]}
                  </span>
                </button>
              );
            })}
          </div>
          <button onClick={openRegionsModal} className="mt-3 w-full text-xs text-primary font-medium flex items-center justify-center gap-1 hover:underline">
            Ver todas las regiones <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Interactive chart */}
      <InteractiveChart proposals={regionProposals} loading={loading} />

      {/* Services summary + Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services table */}
        <div className="bg-card rounded-xl border border-border p-5 min-w-0">
          <h2 className="text-sm font-semibold text-text-main mb-4">Resumen de Servicios</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-secondary">
                  <th className="pb-2 font-medium">Servicio</th>
                  <th className="pb-2 font-medium">Categoría</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium text-right">Planificaciones</th>
                  <th className="pb-2 font-medium text-right">Costo/mes</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => {
                  const stat = byService.get(svc.name);
                  return (
                    <tr key={svc.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-medium text-text-main">{svc.name}</td>
                      <td className="py-2.5 text-text-secondary">{svc.category}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${stat
                            ? 'bg-green-50 dark:bg-green-500/10 text-security'
                            : 'bg-slate-100 dark:bg-slate-800 text-text-secondary'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stat ? 'bg-security' : 'bg-slate-400'}`} />
                          {stat ? 'En uso' : 'Disponible'}
                        </span>
                      </td>
                      <td className="py-2.5 text-text-secondary text-xs text-right">{stat?.count ?? 0}</td>
                      <td className="py-2.5 text-text-secondary text-xs text-right tabular-nums">
                        {stat ? usd(stat.monthly) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Architecture overview */}
        <div className="bg-card rounded-xl border border-border p-5 min-w-0">
          <h2 className="text-sm font-semibold text-text-main mb-4">Estado de Arquitectura</h2>
          <div className="flex flex-col items-center gap-1 py-2">
            {[
              { label: 'Internet', icon: Globe2, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
              { label: 'Route 53', icon: Globe2, color: isUp('Route 53') ? 'bg-blue-50 dark:bg-blue-500/10 text-primary' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border border-dashed border-slate-300 dark:border-slate-600' },
              { label: 'CloudFront', icon: Cloud, color: isUp('CloudFront') ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border border-dashed border-slate-300 dark:border-slate-600' },
              { label: 'VPC', icon: Network, color: isUp('VPC') ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border border-dashed border-slate-300 dark:border-slate-600' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${item.color} text-sm font-medium`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {i < 3 && (
                    <div className="w-0.5 h-4 bg-border" />
                  )}
                </div>
              );
            })}
            <div className="w-0.5 h-4 bg-border" />
            <div className="flex gap-3 mt-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isUp('EC2') ? 'bg-orange-50 dark:bg-orange-500/10 text-costs' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border border-dashed border-slate-300 dark:border-slate-600'}`}>
                <Server className="w-4 h-4" />
                EC2 × {byService.get('EC2')?.count ?? 0}
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isUp('RDS') ? 'bg-green-50 dark:bg-green-500/10 text-security' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 border border-dashed border-slate-300 dark:border-slate-600'}`}>
                <Database className="w-4 h-4" />
                RDS × {byService.get('RDS')?.count ?? 0}
              </div>
            </div>
          </div>
          <p className="text-xs text-text-secondary text-center mt-4">
            Flujo de tráfico: Internet → DNS → CDN → VPC → Recursos de cómputo y datos
          </p>
        </div>
      </div>
    </div>
  );
}