const COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#8B5CF6', '#64748B'];

interface Props {
  totalMonthly: number;
  totalAnnual: number;
  highestService?: string;
  costDistribution: { name: string; percentage: number }[];
}

export default function CostosSummary({ totalMonthly, totalAnnual, highestService, costDistribution }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-main mb-4">Resumen</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Costo mensual estimado</dt>
          <dd className="font-semibold text-text-main tabular-nums">${totalMonthly.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Costo anual estimado</dt>
          <dd className="font-semibold text-text-main tabular-nums">
            ${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Mayor costo</dt>
          <dd className="font-semibold text-[#F59E0B]">{highestService || '—'}</dd>
        </div>
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-text-secondary mb-2">Distribución de costos</p>
          {costDistribution.length === 0 && <p className="text-xs text-text-secondary">Sin datos</p>}
          {costDistribution.map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-xs mb-1.5 last:mb-0">
              <span className="flex items-center gap-2 text-text-secondary min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="truncate">{c.name}</span>
              </span>
              <span className="font-medium text-text-main tabular-nums">{c.percentage}%</span>
            </div>
          ))}
        </div>
      </dl>
    </div>
  );
}