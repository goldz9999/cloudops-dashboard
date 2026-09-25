import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#8B5CF6', '#64748B'];

const tooltipStyle = {
  fontSize: 12,
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-main)',
};

interface Props {
  costDistribution: { name: string; value: number; percentage: number }[];
  barData: { name: string; monthly: number; annual: number }[];
}

export default function CostosCharts({ costDistribution, barData }: Props) {
  return (
    <>
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-main mb-3">Distribución de costos</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={costDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {costDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} contentStyle={tooltipStyle} itemStyle={{ color: 'var(--color-text-main)' }} />
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-main mb-3">Comparativo mensual / anual</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--color-text-main)' }} />
              <Bar dataKey="monthly" fill="#2563EB" name="Mensual" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}