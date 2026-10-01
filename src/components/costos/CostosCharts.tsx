import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#8B5CF6', '#64748B'];

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-main)',
};

interface Props {
  costDistribution: { name: string; value: number; percentage: number }[];
  barData: { name: string; monthly: number; annual: number }[];
}

function Empty() {
  return (
    <div className="h-full flex items-center justify-center text-xs text-text-secondary">Sin costos para mostrar</div>
  );
}

export default function CostosCharts({ costDistribution, barData }: Props) {
  return (
    <>
      <div className="bg-card rounded-xl border border-border p-5 min-w-0">
        <h2 className="text-sm font-semibold text-text-main mb-3">Distribución de costos</h2>
        <div className="h-64">
          {costDistribution.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costDistribution} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {costDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => `$${Number(v).toFixed(2)}`}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: 'var(--color-text-main)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 min-w-0">
        <h2 className="text-sm font-semibold text-text-main mb-3">Costo mensual por servicio</h2>
        <div className="h-64">
          {barData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                />
                <YAxis
                  width={48}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                />
                <Tooltip
                  formatter={(v) => `$${Number(v).toFixed(2)}`}
                  cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: 'var(--color-text-main)' }}
                />
                <Bar dataKey="monthly" name="Mensual" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}