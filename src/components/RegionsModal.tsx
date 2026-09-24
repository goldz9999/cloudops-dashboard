import { useEffect } from 'react';
import { X, Check, Globe2, Server, DollarSign, Activity } from 'lucide-react';
import { useRegion } from '../context/useRegion';
import { regionStatusLabel, summarizeRegion, type RegionStatus } from '../data/regionData';

const badge: Record<RegionStatus, string> = {
  operational: 'bg-green-50 text-[#16A34A] border-green-200',
  review: 'bg-amber-50 text-[#F59E0B] border-amber-200',
  issue: 'bg-red-50 text-[#DC2626] border-red-200',
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={closeRegionsModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="regions-modal-title"
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 id="regions-modal-title" className="text-base font-semibold text-[#1E293B] flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#2563EB]" /> Regiones disponibles
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {regions.length} regiones configuradas. Al seleccionar una, todo el panel se actualiza con sus datos.
            </p>
          </div>
          <button
            onClick={closeRegionsModal}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B]"
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
                  current ? 'border-[#2563EB] bg-blue-50/40 ring-1 ring-[#2563EB]/30' : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B]">{r.name}</p>
                    <p className="text-xs text-[#64748B]">
                      {r.location} · {r.id}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge[r.status]}`}>
                    {regionStatusLabel[r.status]}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-[#64748B]">
                  <span className="flex items-center gap-1"><Server className="w-3 h-3" />{s.servicesUsed} serv.</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{s.monthlyCost.toFixed(0)}/mes</span>
                  <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{r.availability}%</span>
                </div>
                {current ? (
                  <span className="inline-flex items-center justify-center gap-1 text-xs font-medium text-[#2563EB] py-1.5">
                    <Check className="w-3.5 h-3.5" /> Región actual
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setRegionId(r.id);
                      closeRegionsModal();
                    }}
                    className="text-xs font-medium py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 transition-colors"
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