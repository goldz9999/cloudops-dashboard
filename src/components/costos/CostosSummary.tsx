interface Props {
  totalMonthly: number;
  totalAnnual: number;
  highestService: string;
  costDistribution: { name: string; percentage: number }[];
}

export default function CostosSummary({ totalMonthly, totalAnnual, highestService, costDistribution }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-main mb-4">Resumen</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-secondary">Costo mensual estimado</dt>
          <dd className="font-semibold text-text-main">${totalMonthly.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Costo anual estimado</dt>
          <dd className="font-semibold text-text-main">
            ${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Mayor costo</dt>
          <dd className="font-semibold text-[#F59E0B]">{highestService || '—'}</dd>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-text-secondary mb-2">Distribución de costos</p>
          {costDistribution.map((c) => (
            <div key={c.name} className="flex justify-between text-xs mb-1">
              <span className="text-text-secondary">{c.name}</span>
              <span className="font-medium text-text-main">{c.percentage}%</span>
            </div>
          ))}
        </div>
      </dl>
    </div>
  );
}