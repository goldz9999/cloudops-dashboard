import { useState } from 'react';
import { DollarSign, TrendingUp, Server, Plus, Trash2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useRegion } from '../context/useRegion';
import { useNotifications } from '../context/useNotifications';
import { regionLabel, type CostRow } from '../data/regionData';

const COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#8B5CF6', '#64748B'];

const SERVICE_OPTIONS = [
  { name: 'EC2', rate: 0.0528, hours: 730 },
  { name: 'RDS', rate: 0.0704, hours: 730 },
  { name: 'S3', rate: 0.023, hours: 1 },
  { name: 'CloudFront', rate: 0.0274, hours: 1 },
  { name: 'Route 53', rate: 17.12, hours: 1 },
  { name: 'IAM', rate: 0, hours: 1 },
  { name: 'VPC', rate: 0, hours: 1 },
];


interface NumInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  className?: string;
}

// Input numérico que permite borrar el contenido mientras se escribe.
// Mantiene el texto localmente y solo propaga números válidos; al salir del campo
// (blur) restaura el último valor válido si quedó vacío.
function NumInput({ value, onChange, min = 0, className }: NumInputProps) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      value={focused ? text : String(value)}
      onFocus={() => {
        setText(String(value));
        setFocused(true);
      }}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(Number.isFinite(n) ? Math.max(n, min) : min);
      }}
      onBlur={() => setFocused(false)}
      className={className}
    />
  );
}

// Al cambiar de región se vuelve a montar con los costos de esa región (key)
export default function Costos() {
  const { region } = useRegion();
  return <CostosContent key={region.id} initialData={region.costTable} regionText={`${region.id} — ${regionLabel(region)}`} />;
}

function CostosContent({ initialData, regionText }: { initialData: CostRow[]; regionText: string }) {
  const [rows, setRows] = useState<CostRow[]>(initialData);
  const { notify } = useNotifications();

  const [form, setForm] = useState({
    service: 'EC2',
    quantity: 1,
    hours: 730,
    rate: 0.0528,
  });

  const totalMonthly = rows.reduce((sum, r) => sum + r.monthly, 0);
  const totalAnnual = totalMonthly * 12;
  const highest = rows.length
    ? rows.reduce((max, r) => (r.monthly > max.monthly ? r : max), rows[0])
    : null;

  const updateRow = (id: number, field: keyof CostRow, value: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'quantity' || field === 'hours') {
          updated.monthly = +(updated.quantity * updated.hours * updated.rate).toFixed(2);
        }
        return updated;
      })
    );
  };

  const handleServiceChange = (serviceName: string) => {
    const opt = SERVICE_OPTIONS.find((s) => s.name === serviceName);
    setForm((prev) => ({
      ...prev,
      service: serviceName,
      rate: opt?.rate ?? 0.01,
      hours: opt?.hours ?? 730,
    }));
  };

  const addRow = () => {
    const newId = Math.max(...rows.map((r) => r.id), 0) + 1;
    const monthly = +(form.quantity * form.hours * form.rate).toFixed(2);
    setRows((prev) => [
      ...prev,
      {
        id: newId,
        service: form.service,
        quantity: form.quantity,
        hours: form.hours,
        rate: form.rate,
        monthly,
      },
    ]);
    notify({
      type: 'success',
      title: 'Recurso agregado',
      message: `${form.service} — $${monthly.toFixed(2)}/mes.`,
    });
  };

  const removeRow = (id: number) => {
    const removed = rows.find((r) => r.id === id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (removed) notify({ type: 'info', title: 'Recurso eliminado', message: `Se quitó ${removed.service} de la tabla de costos.` });
  };

  // La distribución sale de las filas actuales (se actualiza al editar la tabla)
  const costByService = Object.values(
    rows.reduce<Record<string, { name: string; value: number }>>((acc, r) => {
      acc[r.service] = { name: r.service, value: +((acc[r.service]?.value ?? 0) + r.monthly).toFixed(2) };
      return acc;
    }, {})
  );
  const costDistribution = costByService.map((c) => ({
    ...c,
    percentage: totalMonthly ? Math.round((c.value / totalMonthly) * 100) : 0,
  }));

  const barData = rows.map((r) => ({
    name: r.service,
    monthly: r.monthly,
    annual: +(r.monthly * 12).toFixed(2),
  }));

  const formMonthly = +(form.quantity * form.hours * form.rate).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-main">Costos</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Análisis financiero y calculadora de costos de la infraestructura Cloud en{' '}
          <span className="font-medium text-text-main">{regionText}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Costo mensual', value: `$${totalMonthly.toFixed(2)}`, icon: DollarSign, color: 'text-[#F59E0B]' },
          { label: 'Costo anual', value: `$${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-[#F59E0B]' },
          { label: 'Servicios utilizados', value: rows.length, icon: Server, color: 'text-[#2563EB]' },
          { label: 'Recurso de mayor costo', value: highest?.service || '—', icon: DollarSign, color: 'text-[#DC2626]' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-4">
              <Icon className={`w-4 h-4 ${kpi.color} mb-2`} />
              <p className="text-xl font-semibold text-text-main">{kpi.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Calculator + Form */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {/* Table */}
        <div className="xl:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-main mb-4">Calculadora de costos</h2>
          <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-xs text-text-secondary">
                  <th className="pb-2.5 font-medium pr-3">Servicio</th>
                  <th className="pb-2.5 font-medium pr-3 text-right">Cantidad</th>
                  <th className="pb-2.5 font-medium pr-3 text-right">Horas</th>
                  <th className="pb-2.5 font-medium pr-3 text-right">Tarifa</th>
                  <th className="pb-2.5 font-medium pr-3 text-right">Mensual</th>
                  <th className="pb-2.5 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-text-main">{row.service}</td>
                    <td className="py-2 pr-3 text-right">
                      <NumInput
                        min={1}
                        value={row.quantity}
                        onChange={(v) => updateRow(row.id, 'quantity', v)}
                        className="w-20 px-2 py-1 rounded border border-border text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <NumInput
                        value={row.hours}
                        onChange={(v) => updateRow(row.id, 'hours', v)}
                        className="w-20 px-2 py-1 rounded border border-border text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-right text-text-secondary tabular-nums">${row.rate}</td>
                    <td className="py-2.5 pr-3 text-right font-medium text-text-main">
                      ${row.monthly.toFixed(2)}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-text-secondary hover:text-[#DC2626]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={4} className="pt-3 text-right text-sm font-medium text-text-secondary">
                    Total mensual
                  </td>
                  <td className="pt-3 text-right text-sm font-semibold text-text-main">
                    ${totalMonthly.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Form to add resource */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-main mb-4">Agregar recurso</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Servicio</label>
              <select
                value={form.service}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Cantidad</label>
              <NumInput
                min={1}
                value={form.quantity}
                onChange={(v) => setForm((prev) => ({ ...prev, quantity: v }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Horas</label>
              <NumInput
                value={form.hours}
                onChange={(v) => setForm((prev) => ({ ...prev, hours: v }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Tarifa ($ / hora)</label>
              <div className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-slate-50 dark:bg-slate-800/50 text-text-secondary cursor-not-allowed">
                ${form.rate}
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1">Tarifa fija según el servicio</p>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
              <span className="text-text-secondary">Costo estimado</span>
              <span className="font-semibold text-text-main">${formMonthly.toFixed(2)}</span>
            </div>

            <button
              onClick={addRow}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar a la calculadora
            </button>
          </div>
        </div>
      </div>

      {/* Charts + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-main mb-3">Distribución de costos</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {costDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} contentStyle={{ fontSize: 12, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }} itemStyle={{ color: 'var(--color-text-main)' }} />
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
                <Tooltip contentStyle={{ fontSize: 12, backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }} itemStyle={{ color: 'var(--color-text-main)' }} />
                <Bar dataKey="monthly" fill="#2563EB" name="Mensual" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

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
              <dd className="font-semibold text-[#F59E0B]">{highest?.service || '—'}</dd>
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
      </div>
    </div>
  );
}