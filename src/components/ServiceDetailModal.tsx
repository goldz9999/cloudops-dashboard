import { useEffect } from 'react';
import {
  X,
  Server,
  HardDrive,
  Database,
  Shield,
  Network,
  Globe2,
  Cloud,
  DollarSign,
  Activity,
  Boxes,
} from 'lucide-react';
import { services } from '../data/mockData';
import { useRegion } from '../context/useRegion';
import { regionLabel } from '../data/regionData';

const iconMap: Record<string, React.ElementType> = {
  Server,
  HardDrive,
  Database,
  Shield,
  Network,
  Globe: Globe2,
  Cloud,
};

interface Props {
  serviceId: string | null;
  onClose: () => void;
}

export default function ServiceDetailModal({ serviceId, onClose }: Props) {
  const { region, summary } = useRegion();

  useEffect(() => {
    if (!serviceId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [serviceId, onClose]);

  if (!serviceId) return null;

  const svc = services.find((s) => s.id === serviceId);
  if (!svc) return null;

  const Icon = iconMap[svc.icon] || Server;
  const metric = region.serviceMetrics[svc.id];
  const inUse = metric?.status === 'in-use';
  const monthlyCost = region.costTable
    .filter((c) => c.service === svc.name)
    .reduce((s, c) => s + c.monthly, 0);
  const pctOfTotal = summary.monthlyCost ? Math.round((monthlyCost / summary.monthlyCost) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-detail-title"
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div className="min-w-0">
              <h2 id="service-detail-title" className="text-base font-semibold text-text-main">
                {svc.name}
              </h2>
              <p className="text-xs text-text-secondary">{svc.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                inUse ? 'bg-green-50 dark:bg-green-500/10 text-[#16A34A]' : 'bg-slate-100 dark:bg-slate-800 text-text-secondary'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${inUse ? 'bg-[#16A34A]' : 'bg-slate-400'}`} />
              {inUse ? 'En uso' : 'Disponible'}
            </span>
            <span className="text-xs text-text-secondary">
              {region.id} — {regionLabel(region)}
            </span>
          </div>

          <p className="text-sm text-text-main leading-relaxed">{svc.description}</p>

          <div className="pt-3 border-t border-border">
            <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">Función principal</p>
            <p className="text-sm font-medium text-text-main">{svc.mainFunction}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-1">
                <Boxes className="w-3.5 h-3.5" /> Recursos
              </div>
              <p className="text-lg font-semibold text-text-main">{metric?.resources ?? 0}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-1">
                <Activity className="w-3.5 h-3.5" /> Uso
              </div>
              <p className="text-lg font-semibold text-text-main">{inUse ? `${metric.usage}%` : '—'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 col-span-2">
              <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-1">
                <DollarSign className="w-3.5 h-3.5" /> Costo mensual
              </div>
              <p className="text-lg font-semibold text-text-main">
                ${monthlyCost.toFixed(2)}{' '}
                <span className="text-xs font-normal text-text-secondary">({pctOfTotal}% del total de la región)</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}