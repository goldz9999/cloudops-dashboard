import { useEffect } from 'react';
import { X, Check, Globe2, Server, DollarSign, Activity } from 'lucide-react';
import { useRegion } from '../context/useRegion';
import { regionStatusLabel, summarizeRegion, type RegionStatus } from '../data/regionData';

const badge: Record<RegionStatus, string> = {
  operational: 'bg-green-50 dark:bg-green-500/10 text-security border-green-200 dark:border-green-500/30',
  review: 'bg-amber-50 dark:bg-amber-500/10 text-costs border-amber-200 dark:border-amber-500/30',
  issue: 'bg-red-50 dark:bg-red-500/10 text-alerts border-red-200 dark:border-red-500/30',
};

export default function RegionsModal() {
  const { isRegionsModalOpen, closeRegionsModal, regions, regionId, setRegionId } = useRegion();

  useEffect(() => {
    if (!isRegionsModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRegionsModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRegionsModalOpen, closeRegionsModal]);

  if (!isRegionsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={closeRegionsModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="regions-modal-title"
        className="bg-card rounded-xl border border-border shadow-xl animate-pop-in w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <h2 id="regions-modal-title" className="text-base font-semibold text-text-main flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-primary" /> Regiones disponibles
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {regions.length} regiones configuradas. Al seleccionar una, todo el panel se actualiza con sus datos.
            </p>
          </div>
          <button
            onClick={closeRegionsModal}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regions.map((r) => {
            const s = summarizeRegion(r);
            const current = r.id === regionId;
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-4 flex flex-col gap-3 ${
                  current ? 'border-primary bg-blue-50/40 dark:bg-blue-500/10 ring-1 ring-primary/30' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-main">{r.name}</p>
                    <p className="text-xs text-text-secondary">
                      {r.location} · {r.id}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge[r.status]}`}>
                    {regionStatusLabel[r.status]}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-text-secondary">
                  <span className="flex items-center gap-1"><Server className="w-3 h-3" />{s.servicesUsed} serv.</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{s.monthlyCost.toFixed(0)}/mes</span>
                  <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{r.availability}%</span>
                </div>
                {current ? (
                  <span className="inline-flex items-center justify-center gap-1 text-xs font-medium text-primary py-1.5">
                    <Check className="w-3.5 h-3.5" /> Región actual
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setRegionId(r.id);
                      closeRegionsModal();
                    }}
                    className="text-xs font-medium py-1.5 rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors"
                  >
                    Seleccionar región
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}