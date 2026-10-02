import { useEffect, useState } from 'react';
import {
  Shield, Users, Key, Lock, CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle,
  Activity, Cloud, Loader2, MapPin, Smartphone, Globe,
} from 'lucide-react';
import { sharedResponsibility } from '../data/mockData';
import { useRegion } from '../context/useRegion';
import { regionLabel } from '../data/regionData';
import ExportMenu from '../components/common/ExportMenu';
import { buildSecurityReport } from '../utils/reportBuilders';
import InfoTip from '../components/common/InfoTip';
import { fetchSecurityReport, type CheckStatus, type SecurityCheck, type SecurityReport, type AccessEvent } from '../api/security';
import {
  awsResponsibilityInfo,
  customerResponsibilityInfo,
  accountProtectionInfo,
  dataProtectionInfo,
  type InfoEntry,
} from '../data/securityInfo';

const statusIcon: Record<CheckStatus, React.ReactNode> = {
  healthy: <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />,
  review: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
  issue: <XCircle className="w-4 h-4 text-[#DC2626]" />,
  unknown: <HelpCircle className="w-4 h-4 text-text-secondary" />,
};

const statusBadge: Record<CheckStatus, string> = {
  healthy: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
  review: 'bg-amber-50 dark:bg-amber-500/10 text-[#F59E0B] border-amber-200 dark:border-amber-500/30',
  issue: 'bg-red-50 dark:bg-red-500/10 text-[#DC2626] border-red-200 dark:border-red-500/30',
  unknown: 'bg-slate-50 dark:bg-slate-500/10 text-text-secondary border-border',
};

const statusText: Record<CheckStatus, string> = {
  healthy: 'Correcto',
  review: 'Revisar',
  issue: 'Problema',
  unknown: 'Sin datos',
};

const groupIcon = {
  platform: Lock,
  access: Activity,
  planning: Shield,
  compliance: Key,
} as const;

function Labeled({ label, info }: { label: string; info?: InfoEntry }) {
  if (!info) return <>{label}</>;
  return (
    <InfoTip description={info.description} recommendation={info.recommendation}>
      {label}
    </InfoTip>
  );
}

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function CheckRow({ check }: { check: SecurityCheck }) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-0.5 shrink-0">{statusIcon[check.status]}</span>
          <div className="min-w-0">
            <p className="text-sm text-text-main">{check.label}</p>
            <p className="text-xs text-text-secondary mt-0.5">{check.detail}</p>
            {check.recommendation && check.status !== 'healthy' && (
              <p className="text-xs text-primary mt-1">→ {check.recommendation}</p>
            )}
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusBadge[check.status]}`}>
          {statusText[check.status]}
        </span>
      </div>
    </div>
  );
}

const eventIcon: Record<AccessEvent['type'], React.ReactNode> = {
  impossible_travel: <MapPin className="w-4 h-4" />,
  new_ip: <Globe className="w-4 h-4" />,
  new_device: <Smartphone className="w-4 h-4" />,
};

/** Controles que necesitan una cuenta AWS: se muestran como "sin medir", nunca con valores inventados. */
const AWS_PENDING = {
  account: ['MFA de la cuenta raíz', 'MFA de usuarios IAM', 'Rotación de claves de acceso', 'Política de contraseñas', 'CloudTrail habilitado'],
  data: ['Cifrado en reposo', 'Cifrado en tránsito', 'Copias de seguridad automáticas', 'Listas de control de acceso (ACL)', 'Bloqueo de acceso público en S3'],
};

export default function Seguridad() {
  const { region } = useRegion();
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSecurityReport(region.id)
      .then((r) => !cancelled && setReport(r))
      .catch((e: unknown) => {
        if (cancelled) return;
        setReport(null);
        setError(e instanceof Error ? e.message : 'No se pudo cargar la seguridad.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [region.id]);

  const groups = report?.groups ?? [];
  const score = report?.score ?? 0;
  const scoreColor = score >= 80 ? 'text-[#16A34A]' : score >= 50 ? 'text-[#F59E0B]' : 'text-[#DC2626]';
  const stats = report?.accessStats;
  const events = report?.accessEvents ?? [];
  const findings = groups.flatMap((g) => g.checks).filter((c) => c.status === 'issue' || c.status === 'review').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Seguridad</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Postura de seguridad calculada con datos reales del sistema en{' '}
            <span className="font-medium text-text-main">
              {region.id} — {regionLabel(region)}
            </span>
          </p>
        </div>
        <ExportMenu getReport={() => buildSecurityReport(region, report)} />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="w-4 h-4 animate-spin" /> Analizando accesos, planificaciones y configuración…
        </div>
      )}
      {error && (
        <div className={`rounded-xl border p-4 text-sm ${statusBadge.issue}`}>
          No se pudo obtener el análisis de seguridad: {error}
        </div>
      )}

      {report && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 col-span-2 lg:col-span-1">
              <p className="text-xs text-text-secondary mb-1">Puntaje de seguridad</p>
              {score > 0 ? (
                <>
                  <span className={`text-3xl font-bold ${scoreColor}`}>{score}%</span>
                  <p className="text-[11px] text-text-secondary mt-1">{findings} hallazgo(s) por revisar</p>
                </>
              ) : (
                <span className="text-sm text-text-secondary">Sin datos suficientes</span>
              )}
            </div>
            {groups.map((g) => {
              const Icon = groupIcon[g.id];
              return (
                <div key={g.id} className="bg-card rounded-xl border border-border p-4">
                  <p className="text-xs text-text-secondary mb-2 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" /> {g.label}
                  </p>
                  <div className="flex items-center gap-2">
                    {statusIcon[g.status]}
                    <span className="text-sm font-medium text-text-main">{statusText[g.status]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Qué se mide */}
          <div className="flex items-start gap-2 text-xs text-text-secondary">
            <Info className="w-4 h-4 shrink-0 text-primary mt-px" />
            <p>
              Cada control sale de datos reales: <span className="text-text-main font-medium">accesos</span> registrados en
              Auditoría (GPS, IP, dispositivo), <span className="text-text-main font-medium">planificaciones</span> guardadas,
              <span className="text-text-main font-medium"> configuración</span> del propio sistema y{' '}
              <span className="text-text-main font-medium">cumplimiento</span> atestado manualmente. Lo que requiere AWS se
              marca como “Sin medir”.
            </p>
          </div>

          {/* Accesos: stats + eventos */}
          {stats && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2563EB]" /> Actividad de accesos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {[
                  { label: 'Accesos (24 h)', value: stats.last24h },
                  { label: 'Accesos (7 días)', value: stats.last7d },
                  { label: 'IPs distintas', value: stats.uniqueIps },
                  { label: 'Dispositivos', value: stats.uniqueDevices },
                  { label: 'Lugares', value: stats.uniquePlaces },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border p-3">
                    <p className="text-[11px] text-text-secondary">{s.label}</p>
                    <p className="text-lg font-semibold text-text-main">{s.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary mb-2">Último acceso: {when(stats.lastAccess)}</p>
              {events.length === 0 ? (
                <p className="text-sm text-[#16A34A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Sin anomalías detectadas en los accesos recientes.
                </p>
              ) : (
                <ul className="space-y-2">
                  {events.map((e, i) => (
                    <li key={`${e.type}-${e.at}-${i}`} className={`flex items-start gap-3 rounded-lg border p-3 ${statusBadge[e.severity]}`}>
                      <span className="mt-0.5">{eventIcon[e.type]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs mt-0.5 break-words">{e.detail}</p>
                      </div>
                      <span className="text-[11px] shrink-0">{when(e.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Controles por grupo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g) => {
              const Icon = groupIcon[g.id];
              return (
                <div key={g.id} className="bg-card rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#2563EB]" /> {g.label}
                  </h2>
                  <div className="divide-y divide-border">
                    {g.checks.map((c) => (
                      <CheckRow key={c.id} check={c} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pendiente de AWS */}
          <div className="bg-card rounded-xl border border-dashed border-border p-5">
            <h2 className="text-sm font-semibold text-text-main mb-1 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-orange-500" /> Servicios de la cuenta AWS
            </h2>
            <p className="text-xs text-text-secondary mb-4">
              {report.awsConnected
                ? 'Cuenta AWS conectada.'
                : 'Sin medir: requieren conectar una cuenta AWS. No se muestran valores de ejemplo.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {[...AWS_PENDING.account.map((l) => ({ l, info: accountProtectionInfo[l] })), ...AWS_PENDING.data.map((l) => ({ l, info: dataProtectionInfo[l] }))].map(
                ({ l, info }) => (
                  <div key={l} className="flex items-center justify-between">
                    <span className="text-sm text-text-main">
                      <Labeled label={l} info={info} />
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge.unknown}`}>Sin medir</span>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}

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