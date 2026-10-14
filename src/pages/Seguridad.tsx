import { useMemo, useState } from 'react';
import {
  Shield, Users, KeyRound, Lock, CheckCircle2, AlertTriangle, XCircle, Info, Network, Radar,
  ScrollText, Database, HardDrive, Server, FlaskConical, Fingerprint, ClipboardCheck,
} from 'lucide-react';
import { sharedResponsibility } from '../data/mockData';
import { useRegion } from '../context/useRegion';
import { regionLabel, type HealthStatus } from '../data/regionData';
import ExportMenu from '../components/common/ExportMenu';
import { buildSecurityReport } from '../utils/reportBuilders';
import InfoTip from '../components/common/InfoTip';
import {
  getMockSecurity,
  getMockSecurityReport,
  type SecurityArea,
  type SecurityControl,
  type Severity,
} from '../data/securityMock';
import { awsResponsibilityInfo, customerResponsibilityInfo, type InfoEntry } from '../data/securityInfo';

const statusIcon: Record<HealthStatus, React.ReactNode> = {
  healthy: <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />,
  review: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
  issue: <XCircle className="w-4 h-4 text-[#DC2626]" />,
};

const statusBadge: Record<HealthStatus, string> = {
  healthy: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
  review: 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706] border-amber-200 dark:border-amber-500/30',
  issue: 'bg-red-50 dark:bg-red-500/10 text-[#DC2626] border-red-200 dark:border-red-500/30',
};

const statusText: Record<HealthStatus, string> = { healthy: 'Correcto', review: 'Revisar', issue: 'Problema' };

const severityBadge: Record<Severity, string> = {
  Alta: statusBadge.issue,
  Media: statusBadge.review,
  Baja: 'bg-blue-50 dark:bg-blue-500/10 text-[#2563EB] border-blue-200 dark:border-blue-500/30',
};

const areaIcon: Record<SecurityArea['id'], React.ComponentType<{ className?: string }>> = {
  iam: Fingerprint,
  network: Network,
  detection: Radar,
  data: Lock,
};

const resourceIcon = { S3: HardDrive, RDS: Database, EC2: Server } as const;

const pctColor = (n: number) => (n >= 90 ? 'text-[#16A34A]' : n >= 75 ? 'text-[#F59E0B]' : 'text-[#DC2626]');
const barColor = (n: number) => (n >= 90 ? 'bg-[#16A34A]' : n >= 75 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]');
const when = (iso: string) => new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

function Labeled({ label, info }: { label: string; info?: InfoEntry }) {
  if (!info) return <>{label}</>;
  return (
    <InfoTip description={info.description} recommendation={info.recommendation}>
      {label}
    </InfoTip>
  );
}

function ControlRow({ c }: { c: SecurityControl }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <div className="flex items-start gap-2 min-w-0">
        <span className="mt-0.5 shrink-0">{statusIcon[c.status]}</span>
        <div className="min-w-0">
          <p className="text-sm text-text-main">{c.label}</p>
          <p className="text-xs text-text-secondary">{c.detail}</p>
        </div>
      </div>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusBadge[c.status]}`}>
        {statusText[c.status]}
      </span>
    </li>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="w-24 h-24 shrink-0" role="img" aria-label={`Security Score ${score} de 100`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
        className={score >= 90 ? 'stroke-[#16A34A]' : score >= 75 ? 'stroke-[#F59E0B]' : 'stroke-[#DC2626]'}
        strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 40 40)"
      />
      <text x="40" y="38" textAnchor="middle" className="fill-text-main" fontSize="18" fontWeight="700">{score}</text>
      <text x="40" y="52" textAnchor="middle" className="fill-text-secondary" fontSize="9">/ 100</text>
    </svg>
  );
}

export default function Seguridad() {
  const { region } = useRegion();
  const data = useMemo(() => getMockSecurity(region.id), [region.id]);
  const [severity, setSeverity] = useState<Severity | 'Todas'>('Todas');

  const open = data.findings.filter((f) => f.state !== 'Resuelto');
  const findings = severity === 'Todas' ? data.findings : data.findings.filter((f) => f.severity === severity);
  const scoreState: HealthStatus = data.score >= 90 ? 'healthy' : data.score >= 75 ? 'review' : 'issue';

  const metrics = [
    { label: 'MFA', value: `${data.metrics.mfa}%`, n: data.metrics.mfa, icon: KeyRound },
    { label: 'IAM', value: `${data.metrics.iam}%`, n: data.metrics.iam, icon: Users },
    { label: 'Security Groups', value: `${data.metrics.securityGroups}%`, n: data.metrics.securityGroups, icon: Network },
    { label: 'CloudTrail', value: `${data.metrics.cloudTrail}%`, n: data.metrics.cloudTrail, icon: ScrollText },
    { label: 'AWS Config', value: `${data.metrics.config}%`, n: data.metrics.config, icon: ClipboardCheck },
    { label: 'GuardDuty', value: data.metrics.guardDuty, n: 100, icon: Radar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main flex items-center gap-2">
            Seguridad
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-border text-text-secondary">
              <FlaskConical className="w-3 h-3" /> Datos simulados
            </span>
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Postura de seguridad de ejemplo basada en servicios de AWS en{' '}
            <span className="font-medium text-text-main">
              {region.id} — {regionLabel(region)}
            </span>
          </p>
        </div>
        <ExportMenu getReport={() => buildSecurityReport(region, getMockSecurityReport(region.id))} />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <ScoreRing score={data.score} />
          <div className="min-w-0">
            <p className="text-xs text-text-secondary">Security Score</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge[scoreState]}`}>
              {scoreState === 'healthy' ? 'Buen estado' : scoreState === 'review' ? 'Mejorable' : 'En riesgo'}
            </span>
            <p className="text-xs text-text-secondary mt-2">
              <span className="font-semibold text-text-main">{open.length}</span> hallazgos abiertos
            </p>
          </div>
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-text-secondary flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {m.label}
                </p>
                <p className={`text-xl font-semibold mt-1 ${pctColor(m.n)}`}>{m.value}</p>
                <div className="h-1.5 rounded-full bg-border mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(m.n)}`} style={{ width: `${m.n}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventario IAM y red */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2563EB]" /> IAM
          </h2>
          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: 'Usuarios', value: data.iam.users },
              { label: 'Roles', value: data.iam.roles },
              { label: 'Políticas', value: data.iam.policies },
              { label: 'Usuarios con MFA', value: `${data.iam.usersWithMfa}/${data.iam.users}` },
              { label: 'Claves > 90 días', value: data.iam.oldAccessKeys },
              { label: 'MFA cuenta raíz', value: data.iam.rootMfa ? 'Sí' : 'No' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border px-3 py-2">
                <dt className="text-[11px] text-text-secondary">{s.label}</dt>
                <dd className="text-base font-semibold text-text-main tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
            <Network className="w-4 h-4 text-[#2563EB]" /> Red
          </h2>
          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: 'VPC', value: data.network.vpcs },
              { label: 'Security Groups', value: data.network.securityGroups },
              { label: 'SG abiertos', value: data.network.openSecurityGroups },
              { label: 'Network ACL', value: data.network.nacls },
              { label: 'VPC Flow Logs', value: data.network.flowLogs ? 'Activos' : 'No' },
              { label: 'GuardDuty', value: data.metrics.guardDuty },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border px-3 py-2">
                <dt className="text-[11px] text-text-secondary">{s.label}</dt>
                <dd className="text-base font-semibold text-text-main tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Controles por área */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.areas.map((a) => {
          const Icon = areaIcon[a.id];
          return (
            <div key={a.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#2563EB]" /> {a.label}
                </h2>
                <span className={`text-sm font-semibold tabular-nums ${pctColor(a.score)}`}>{a.score}%</span>
              </div>
              <ul className="divide-y divide-border">
                {a.controls.map((c) => (
                  <ControlRow key={c.label} c={c} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Seguridad por recurso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data.resources.map((r) => {
          const Icon = resourceIcon[r.service];
          const pct = Math.round((r.compliant / r.total) * 100);
          return (
            <div key={r.service} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#2563EB]" /> {r.service} Security
                </h2>
                <span className={`text-sm font-semibold tabular-nums ${pctColor(pct)}`}>{pct}%</span>
              </div>
              <p className="text-xs text-text-secondary mb-3">
                {r.compliant} de {r.total} recursos sin hallazgos
              </p>
              <ul className="divide-y divide-border">
                {r.controls.map((c) => (
                  <ControlRow key={c.label} c={c} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Hallazgos */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2563EB]" /> Hallazgos y recursos con configuración insegura
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">Origen simulado: GuardDuty, AWS Config, Security Hub e IAM Access Analyzer</p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg border border-border self-start">
            {(['Todas', 'Alta', 'Media', 'Baja'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${severity === s ? 'bg-[#2563EB] text-white' : 'text-text-secondary hover:text-text-main'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs text-text-secondary border-b border-border">
                <th className="pb-2 pr-3 font-medium w-20">Severidad</th>
                <th className="pb-2 pr-3 font-medium">Hallazgo</th>
                <th className="pb-2 pr-3 font-medium">Recurso</th>
                <th className="pb-2 pr-3 font-medium w-28">Origen</th>
                <th className="pb-2 pr-3 font-medium w-28">Detectado</th>
                <th className="pb-2 font-medium w-24">Estado</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0 align-top">
                  <td className="py-2.5 pr-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${severityBadge[f.severity]}`}>{f.severity}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <p className="text-text-main">{f.title}</p>
                    <p className="text-xs text-primary mt-0.5">→ {f.recommendation}</p>
                  </td>
                  <td className="py-2.5 pr-3">
                    <p className="text-text-main font-mono text-xs">{f.resource}</p>
                    <p className="text-xs text-text-secondary">{f.service}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-text-secondary">{f.source}</td>
                  <td className="py-2.5 pr-3 text-xs text-text-secondary tabular-nums">{when(f.detectedAt)}</td>
                  <td className="py-2.5 text-xs">
                    <span className={f.state === 'Resuelto' ? 'text-[#16A34A]' : f.state === 'En revisión' ? 'text-[#D97706]' : 'text-text-main'}>
                      {f.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modelo de responsabilidad compartida (contenido educativo) */}
      <div className="flex items-start gap-2 text-xs text-text-secondary">
        <Info className="w-4 h-4 shrink-0 text-primary mt-px" />
        <p>
          <span className="font-medium text-text-main">Modelo de responsabilidad compartida:</span> AWS protege la nube (la
          infraestructura) y tú proteges lo que hay <em>dentro</em> de ella. Pasa el cursor sobre cualquier elemento con el
          icono ⓘ para ver qué significa.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-main">AWS</h2>
              <p className="text-xs text-text-secondary">Seguridad <strong className="font-semibold text-text-main">DE</strong> la nube — AWS protege la infraestructura</p>
            </div>
          </div>
          <ul className="space-y-2">
            {sharedResponsibility.aws.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-text-main">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <Labeled label={item} info={awsResponsibilityInfo[item]} />
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-main">Cliente</h2>
              <p className="text-xs text-text-secondary">Seguridad <strong className="font-semibold text-text-main">EN</strong> la nube — tú proteges tus datos, accesos y configuración</p>
            </div>
          </div>
          <ul className="space-y-2">
            {sharedResponsibility.customer.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-text-main">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <Labeled label={item} info={customerResponsibilityInfo[item]} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}