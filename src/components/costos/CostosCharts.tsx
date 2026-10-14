import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { usd, type CostSlice } from './costFormat';

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-main)',
};

interface Props {
  costDistribution: CostSlice[];
  totalMonthly: number;
}

function Empty() {
  return <div className="h-full flex items-center justify-center text-xs text-text-secondary">Sin costos para mostrar</div>;
}

export default function CostosCharts({ costDistribution, totalMonthly }: Props) {
  const barData = costDistribution.map((c) => ({ name: c.name, mensual: c.value, anual: +(c.value * 12).toFixed(2), color: c.color }));
  const barHeight = Math.max(200, barData.length * 40 + 40);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Dona con total al centro + leyenda con importes */}
      <div className="bg-card rounded-xl border border-border p-5 min-w-0">
        <h2 className="text-sm font-semibold text-text-main mb-3">Distribución de costos</h2>
        {costDistribution.length === 0 ? (
          <div className="h-56"><Empty /></div>
        ) : (
          <div className="flex flex-col 2xl:flex-row items-center gap-4">
            <div className="relative w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                    {costDistribution.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => usd(Number(v))} contentStyle={tooltipStyle} itemStyle={{ color: 'var(--color-text-main)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-text-secondary">Mensual</span>
                <span className="text-sm font-semibold text-text-main tabular-nums">{usd(totalMonthly)}</span>
              </div>
            </div>
            <ul className="flex-1 w-full space-y-1.5 min-w-0">
              {costDistribution.map((c) => (
                <li key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="flex-1 truncate text-text-secondary">{c.name}</span>
                  <span className="tabular-nums text-text-main font-medium">{usd(c.value)}</span>
                  <span className="w-9 text-right tabular-nums text-text-secondary">{c.percentage}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Barras horizontales ordenadas: se leen bien aunque haya muchos servicios */}
      <div className="bg-card rounded-xl border border-border p-5 min-w-0">
        <h2 className="text-sm font-semibold text-text-main mb-3">Costo mensual por servicio</h2>
        {barData.length === 0 ? (
          <div className="h-56"><Empty /></div>
        ) : (
          <div style={{ height: barHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={84}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                />
                <Tooltip
                  formatter={(v, key) => [usd(Number(v)), key === 'mensual' ? 'Mensual' : 'Anual']}
                  cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: 'var(--color-text-main)' }}
                />
                <Bar dataKey="mensual" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {barData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}