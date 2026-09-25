import { Shield, Users, Key, FileText, Lock, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { sharedResponsibility, iamCards } from '../data/mockData';
import { useRegion } from '../context/useRegion';
import { regionLabel } from '../data/regionData';
import ExportMenu from '../components/common/ExportMenu';
import { buildSecurityReport } from '../utils/reportBuilders';
import InfoTip from '../components/common/InfoTip';
import {
  awsResponsibilityInfo,
  customerResponsibilityInfo,
  accountProtectionInfo,
  dataProtectionInfo,
  complianceInfo,
  type InfoEntry,
} from '../data/securityInfo';

const statusIcon = {
  healthy: <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />,
  review: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
  issue: <XCircle className="w-4 h-4 text-[#DC2626]" />,
};

const statusBadge = {
  healthy: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
  review: 'bg-amber-50 dark:bg-amber-500/10 text-[#F59E0B] border-amber-200 dark:border-amber-500/30',
  issue: 'bg-red-50 dark:bg-red-500/10 text-[#DC2626] border-red-200 dark:border-red-500/30',
};

/** Etiqueta con tooltip si existe explicación para ella; si no, texto plano. */
function Labeled({ label, info }: { label: string; info?: InfoEntry }) {
  if (!info) return <>{label}</>;
  return (
    <InfoTip description={info.description} recommendation={info.recommendation}>
      {label}
    </InfoTip>
  );
}

export default function Seguridad() {
  const { region } = useRegion();
  const securityItems = { score: region.securityScore, ...region.security };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Seguridad</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Resumen de seguridad — IAM, protección de datos, cuentas y cumplimiento en{' '}
            <span className="font-medium text-text-main">
              {region.id} — {regionLabel(region)}
            </span>
          </p>
        </div>
        <ExportMenu getReport={() => buildSecurityReport(region)} />
      </div>

      {/* Top summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-text-secondary mb-1">Puntaje de seguridad</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-[#16A34A]">{securityItems.score}%</span>
          </div>
        </div>
        {[
          { label: 'IAM', status: securityItems.iam },
          { label: 'Protección de datos', status: securityItems.dataProtection },
          { label: 'Protección de cuentas', status: securityItems.accountProtection },
          { label: 'Cumplimiento', status: securityItems.compliance },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary mb-2">{item.label}</p>
            <div className="flex items-center gap-2">
              {statusIcon[item.status]}
              <span className={`text-sm font-medium capitalize ${item.status === 'healthy' ? 'text-[#16A34A]' : item.status === 'review' ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`}>
                {item.status === 'healthy' ? 'Saludable' : item.status === 'review' ? 'Revisar' : 'Problema'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Shared Responsibility Model */}
      <div className="flex items-start gap-2 text-xs text-text-secondary">
        <Info className="w-4 h-4 shrink-0 text-primary mt-px" />
        <p>
          <span className="font-medium text-text-main">Modelo de responsabilidad compartida:</span> AWS protege la
          nube (la infraestructura) y tú proteges lo que hay <em>dentro</em> de ella. Pasa el cursor sobre cualquier
          elemento con el icono ⓘ para ver qué significa.
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

      {/* IAM Cards */}
      <div>
        <h2 className="text-sm font-semibold text-text-main mb-3">IAM — Gestión de identidades y accesos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {iamCards.map((card) => (
            <div key={card.title} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary">{card.title}</span>
                {statusIcon[card.status]}
              </div>
              <p className="text-lg font-semibold text-text-main">{card.value}</p>
              <p className="text-[11px] text-text-secondary mt-1">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account & Data Protection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-[#2563EB]" />
            Protección de cuentas
          </h2>
          <div className="space-y-3">
            {[
              { label: 'MFA de la cuenta raíz', status: 'healthy' as const },
              { label: 'MFA de usuarios IAM', status: 'healthy' as const },
              { label: 'Rotación de claves de acceso', status: 'review' as const },
              { label: 'Política de contraseñas', status: 'healthy' as const },
              { label: 'CloudTrail habilitado', status: 'healthy' as const },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-text-main"><Labeled label={item.label} info={accountProtectionInfo[item.label]} /></span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge[item.status]}`}>
                  {item.status === 'healthy' ? '🟢 Correcto' : item.status === 'review' ? '🟡 Revisión' : '🔴 Problema'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#16A34A]" />
            Protección de datos
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Cifrado en reposo', status: 'healthy' as const },
              { label: 'Cifrado en tránsito', status: 'healthy' as const },
              { label: 'Copias de seguridad automáticas', status: 'healthy' as const },
              { label: 'Listas de control de acceso (ACL)', status: 'review' as const },
              { label: 'Bloqueo de acceso público en S3', status: 'healthy' as const },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-text-main"><Labeled label={item.label} info={dataProtectionInfo[item.label]} /></span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge[item.status]}`}>
                  {item.status === 'healthy' ? '🟢 Correcto' : item.status === 'review' ? '🟡 Revisión' : '🔴 Problema'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2563EB]" />
          Cumplimiento
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'ISO 27001', status: 'healthy' as const },
            { name: 'SOC 2', status: 'healthy' as const },
            { name: 'GDPR', status: 'healthy' as const },
            { name: 'HIPAA', status: 'review' as const },
          ].map((item) => (
            <div
              key={item.name}
              className={`rounded-lg border p-3 ${statusBadge[item.status]}`}
            >
              <p className="text-sm font-medium">
                <Labeled label={item.name} info={complianceInfo[item.name]} />
              </p>
              <p className="text-xs mt-1">
                {item.status === 'healthy' ? '🟢 Conforme' : '🟡 En revisión'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}