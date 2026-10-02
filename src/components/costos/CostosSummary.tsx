import { usd, type CostSlice } from './costFormat';

interface Props {
  totalMonthly: number;
  totalAnnual: number;
  highest?: { service: string; monthly: number } | null;
  costDistribution: CostSlice[];
}

export default function CostosSummary({ totalMonthly, totalAnnual, highest, costDistribution }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-main mb-3">Resumen</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Mensual estimado</dt>
          <dd className="font-semibold text-text-main tabular-nums">{usd(totalMonthly)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Anual estimado</dt>
          <dd className="font-semibold text-text-main tabular-nums">{usd(totalAnnual)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Mayor costo</dt>
          <dd className="font-semibold text-[#F59E0B] tabular-nums">
            {highest ? `${highest.service} · ${usd(highest.monthly)}` : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-text-secondary mb-2">Distribución de costos</p>
        {costDistribution.length === 0 ? (
          <p className="text-xs text-text-secondary">Sin datos</p>
        ) : (
          <>
            <div className="flex h-2 rounded-full overflow-hidden bg-border" role="img" aria-label="Distribución de costos">
              {costDistribution.map((c) => (
                <div key={c.name} style={{ width: `${(c.value / (totalMonthly || 1)) * 100}%`, background: c.color }} title={`${c.name}: ${c.percentage}%`} />
              ))}
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
              {costDistribution.map((c) => (
                <li key={c.name} className="flex items-center justify-between text-xs min-w-0">
                  <span className="flex items-center gap-1.5 text-text-secondary min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="font-medium text-text-main tabular-nums">{c.percentage}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}