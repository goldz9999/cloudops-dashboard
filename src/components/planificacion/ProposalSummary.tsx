interface Summary {
  name: string;
  type: string;
  region: string;
  users: string;
  availability: string;
  migration: string;
  selected: string[];
}

interface Service {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  summary: Summary;
  services: Service[];
  isSaved: boolean;
}

export default function ProposalSummary({ summary, services, isSaved }: Props) {
  const summaryServices = services.filter((s) => summary.selected.includes(s.id));

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-main">Resumen de la propuesta</h2>
        {isSaved && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-text-secondary">Guardada</span>
        )}
      </div>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Solución Cloud</dt>
          <dd className="font-medium text-text-main text-right max-w-[60%] truncate">{summary.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Tipo</dt>
          <dd className="font-medium text-text-main">{summary.type}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Región</dt>
          <dd className="font-medium text-text-main">{summary.region}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Usuarios</dt>
          <dd className="font-medium text-text-main">{Number(summary.users).toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Disponibilidad</dt>
          <dd className="font-medium text-text-main">{summary.availability}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Migración</dt>
          <dd className="font-medium text-text-main">{summary.migration}</dd>
        </div>
      </dl>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs font-medium text-text-secondary mb-2">Servicios seleccionados</p>
        <div className="flex flex-wrap gap-2">
          {summaryServices.map((svc) => {
            const Icon = svc.icon;
            return (
              <div key={svc.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-[#2563EB] text-xs font-medium">
                <Icon className="w-3.5 h-3.5" />
                {svc.name}
              </div>
            );
          })}
          {summaryServices.length === 0 && <p className="text-xs text-text-secondary">Ningún servicio seleccionado</p>}
        </div>
      </div>
    </div>
  );
}