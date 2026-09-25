import { FolderClock, Plus } from 'lucide-react';
import type { Proposal } from './planTypes';

interface Props {
  proposals: Proposal[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function ProposalList({ proposals, selectedId, onSelect }: Props) {
  if (proposals.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-main flex items-center gap-1.5">
          <FolderClock className="w-4 h-4 text-[#2563EB]" />
          Propuestas guardadas
        </h3>
        <span className="text-[10px] text-[#94A3B8]">Se guardan en este navegador</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {selectedId !== null && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#93C5FD] bg-blue-50/60 dark:bg-blue-500/10 text-[#2563EB] text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Ver propuesta nueva (en edición)
          </button>
        )}
        {proposals.map((p) => {
          const isActive = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                isActive
                  ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-500/10'
                  : 'border-border bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-main truncate">{p.name}</p>
                <p className="text-[11px] text-text-secondary">
                  {p.type} · {p.region} · {Number(p.users || 0).toLocaleString()} usuarios
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Creada: {p.createdAt}</p>
              </div>
              <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#2563EB] border border-blue-100 dark:border-blue-500/30">
                {p.selected.length} servicios
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}