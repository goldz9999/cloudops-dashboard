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
import { useRegion } from '../context/useRegion';
import RegionSelector from '../components/RegionSelector';
import { regionLabel, regionStatusLabel, type HealthStatus } from '../data/regionData';

const COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#8B5CF6', '#64748B'];

const statusColor = {
  operational: 'bg-[#16A34A]',
  review: 'bg-[#F59E0B]',
  issue: 'bg-[#DC2626]',
};

const healthText: Record<HealthStatus, string> = { healthy: 'Saludable', review: 'Revisar', issue: 'Problema' };
const healthColor: Record<HealthStatus, string> = {
  healthy: 'text-[#16A34A]',
  review: 'text-[#F59E0B]',
  issue: 'text-[#DC2626]',
};
const statusBadgeCls = {
  operational: 'bg-green-50 text-[#16A34A] border-green-100',
  review: 'bg-amber-50 text-[#F59E0B] border-amber-100',
  issue: 'bg-red-50 text-[#DC2626] border-red-100',
};

export default function Dashboard() {
  const { region, summary, regions, setRegionId, openRegionsModal } = useRegion();
  const kpiData = {
    servicesUsed: summary.servicesUsed,
    cloudResources: summary.cloudResources,
    monthlyCost: summary.monthlyCost,
    annualCost: summary.annualCost,
    securityScore: region.securityScore,
    availability: region.availability,
  };
  const costDistribution = summary.costDistribution;
  const metrics = region.serviceMetrics;
  const isUp = (id: string) => metrics[id]?.status === 'in-use';
  const otherRegions = [region, ...regions.filter((r) => r.id !== region.id)].slice(0, 3);
  const now = new Date().toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#1E293B]">Resumen de la Infraestructura Cloud</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Resumen completo de la infraestructura Cloud planificada y desplegada en{' '}
            <span className="font-medium text-[#1E293B]">
              {region.id} — {regionLabel(region)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <span className="px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] max-w-full">
            <RegionSelector />
          </span>
          <span className={`px-2.5 py-1 rounded-md font-medium border ${statusBadgeCls[region.status]}`}>
            Estado: {regionStatusLabel[region.status]}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0]">
            Actualizado: {now}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Servicios utilizados', value: kpiData.servicesUsed, icon: Cloud, color: 'text-[#2563EB]' },
          { label: 'Recursos Cloud', value: kpiData.cloudResources, icon: Server, color: 'text-[#2563EB]' },
          { label: 'Costo mensual', value: `$${kpiData.monthlyCost.toFixed(2)}`, icon: DollarSign, color: 'text-[#F59E0B]' },
          { label: 'Costo anual', value: `$${kpiData.annualCost.toLocaleString()}`, icon: DollarSign, color: 'text-[#F59E0B]' },
          { label: 'Seguridad', value: `${kpiData.securityScore}%`, icon: Shield, color: 'text-[#16A34A]' },
          { label: 'Disponibilidad', value: `${kpiData.availability}%`, icon: Activity, color: 'text-[#16A34A]' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-semibold text-[#1E293B]">{kpi.value}</p>
              <p className="text-xs text-[#64748B]">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Cost Analysis */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-1">Análisis de Costos</h2>
          <p className="text-xs text-[#64748B] mb-4">Distribución mensual por servicio</p>
          <div className="h-52">
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
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-[#64748B]">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-3 border-t border-[#E2E8F0] flex justify-between text-sm">
            <span className="text-[#64748B]">Total mensual</span>
            <span className="font-semibold text-[#1E293B]">${kpiData.monthlyCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Security Status */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-1">Estado de Seguridad</h2>
          <p className="text-xs text-[#64748B] mb-4">Resumen de postura de seguridad</p>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="3"
                  strokeDasharray={`${kpiData.securityScore}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-[#16A34A]">{kpiData.securityScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#1E293B]">Seguridad general</p>
              <p className="text-xs text-[#64748B]">Puntuación basada en IAM, MFA y protección de datos</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'IAM', status: healthText[region.security.iam], color: healthColor[region.security.iam] },
              {
                label: 'MFA',
                status: region.security.mfa === 'healthy' ? 'Habilitado' : region.security.mfa === 'review' ? 'Parcial' : 'Deshabilitado',
                color: healthColor[region.security.mfa],
              },
              { label: 'Protección de datos', status: healthText[region.security.dataProtection], color: healthColor[region.security.dataProtection] },
              { label: 'Cumplimiento', status: healthText[region.security.compliance], color: healthColor[region.security.compliance] },
              { label: 'Modelo responsabilidad', status: 'Documentado', color: 'text-[#2563EB]' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-[#64748B]">{item.label}</span>
                <span className={`font-medium ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Infrastructure */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-1">Infraestructura Global</h2>
          <p className="text-xs text-[#64748B] mb-4">Regiones configuradas ({regions.length})</p>
          <div className="space-y-3">
            {otherRegions.map((r) => (
              <button
                key={r.id}
                onClick={() => setRegionId(r.id)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  r.id === region.id
                    ? 'bg-blue-50/60 border-[#2563EB]'
                    : 'bg-slate-50 border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusColor[r.status]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1E293B] truncate">{r.name}</p>
                  <p className="text-xs text-[#64748B]">{r.location}</p>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-[#64748B]">
                  {r.id === region.id ? 'Actual' : regionStatusLabel[r.status]}
                </span>
              </button>
            ))}
          </div>
          <button onClick={openRegionsModal} className="mt-3 w-full text-xs text-[#2563EB] font-medium flex items-center justify-center gap-1 hover:underline">
            Ver todas las regiones <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Services summary + Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-4">Resumen de Servicios</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left text-xs text-[#64748B]">
                  <th className="pb-2 font-medium">Servicio</th>
                  <th className="pb-2 font-medium">Categoría</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium text-right">Recursos</th>
                  <th className="pb-2 font-medium text-right">Uso</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id} className="border-b border-[#E2E8F0] last:border-0">
                    <td className="py-2.5 font-medium text-[#1E293B]">{svc.name}</td>
                    <td className="py-2.5 text-[#64748B]">{svc.category}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          isUp(svc.id)
                            ? 'bg-green-50 text-[#16A34A]'
                            : 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isUp(svc.id) ? 'bg-[#16A34A]' : 'bg-slate-400'
                          }`}
                        />
                        {isUp(svc.id) ? 'En uso' : 'Disponible'}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#64748B] text-xs text-right">{metrics[svc.id]?.resources ?? 0}</td>
                    <td className="py-2.5 text-[#64748B] text-xs text-right">
                      {metrics[svc.id]?.status === 'in-use' ? `${metrics[svc.id].usage}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Architecture overview */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-4">Estado de Arquitectura</h2>
          <div className="flex flex-col items-center gap-1 py-2">
            {[
              { label: 'Internet', icon: Globe2, color: 'bg-slate-100 text-slate-600' },
              { label: 'Route 53', icon: Globe2, color: isUp('route53') ? 'bg-blue-50 text-[#2563EB]' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-300' },
              { label: 'CloudFront', icon: Cloud, color: isUp('cloudfront') ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-300' },
              { label: 'VPC', icon: Network, color: isUp('vpc') ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-300' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${item.color} text-sm font-medium`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {i < 3 && (
                    <div className="w-0.5 h-4 bg-[#E2E8F0]" />
                  )}
                </div>
              );
            })}
            <div className="w-0.5 h-4 bg-[#E2E8F0]" />
            <div className="flex gap-3 mt-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isUp('ec2') ? 'bg-orange-50 text-[#F59E0B]' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-300'}`}>
                <Server className="w-4 h-4" />
                EC2 × {metrics.ec2?.resources ?? 0}
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${isUp('rds') ? 'bg-green-50 text-[#16A34A]' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-300'}`}>
                <Database className="w-4 h-4" />
                RDS × {metrics.rds?.resources ?? 0}
              </div>
            </div>
          </div>
          <p className="text-xs text-[#64748B] text-center mt-4">
            Flujo de tráfico: Internet → DNS → CDN → VPC → Recursos de cómputo y datos
          </p>
        </div>
      </div>
    </div>
  );
}