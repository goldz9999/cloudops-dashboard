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
import { costTableData as initialData, costDistribution } from '../data/mockData';

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

interface CostRow {
  id: number;
  service: string;
  quantity: number;
  hours: number;
  rate: number;
  monthly: number;
}

export default function Costos() {
  const [rows, setRows] = useState<CostRow[]>(initialData);

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
        if (field === 'quantity' || field === 'hours' || field === 'rate') {
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
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const barData = rows.map((r) => ({
    name: r.service,
    monthly: r.monthly,
    annual: +(r.monthly * 12).toFixed(2),
  }));

  const formMonthly = +(form.quantity * form.hours * form.rate).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1E293B]">Costos</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Análisis financiero y calculadora de costos de la infraestructura Cloud
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
            <div key={kpi.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <Icon className={`w-4 h-4 ${kpi.color} mb-2`} />
              <p className="text-xl font-semibold text-[#1E293B]">{kpi.value}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Calculator + Form */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {/* Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-4">Calculadora de costos</h2>
          <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-[#E2E8F0] text-left text-xs text-[#64748B]">
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
                  <tr key={row.id} className="border-b border-[#E2E8F0]/last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-[#1E293B]">{row.service}</td>
                    <td className="py-2 pr-3 text-right">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.id, 'quantity', +e.target.value)}
                        className="w-16 px-2 py-1 rounded border border-[#E2E8F0] text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <input
                        type="number"
                        value={row.hours}
                        onChange={(e) => updateRow(row.id, 'hours', +e.target.value)}
                        className="w-16 px-2 py-1 rounded border border-[#E2E8F0] text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <input
                        type="number"
                        step="0.0001"
                        value={row.rate}
                        onChange={(e) => updateRow(row.id, 'rate', +e.target.value)}
                        className="w-20 px-2 py-1 rounded border border-[#E2E8F0] text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium text-[#1E293B]">
                      ${row.monthly.toFixed(2)}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-1 rounded hover:bg-red-50 text-[#64748B] hover:text-[#DC2626]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E2E8F0]">
                  <td colSpan={4} className="pt-3 text-right text-sm font-medium text-[#64748B]">
                    Total mensual
                  </td>
                  <td className="pt-3 text-right text-sm font-semibold text-[#1E293B]">
                    ${totalMonthly.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Form to add resource */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-4">Agregar recurso</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">Servicio</label>
              <select
                value={form.service}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 bg-white"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">Cantidad</label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: +e.target.value || 1 }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">Horas</label>
              <input
                type="number"
                min={0}
                value={form.hours}
                onChange={(e) => setForm((prev) => ({ ...prev, hours: +e.target.value || 0 }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">Tarifa ($)</label>
              <input
                type="number"
                step="0.0001"
                min={0}
                value={form.rate}
                onChange={(e) => setForm((prev) => ({ ...prev, rate: +e.target.value || 0 }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-sm">
              <span className="text-[#64748B]">Costo estimado</span>
              <span className="font-semibold text-[#1E293B]">${formMonthly.toFixed(2)}</span>
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Distribución de costos</h2>
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
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} contentStyle={{ fontSize: 12 }} />
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Comparativo mensual / anual</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="monthly" fill="#2563EB" name="Mensual" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-4">Resumen</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Costo mensual estimado</dt>
              <dd className="font-semibold text-[#1E293B]">${totalMonthly.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Costo anual estimado</dt>
              <dd className="font-semibold text-[#1E293B]">
                ${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Mayor costo</dt>
              <dd className="font-semibold text-[#F59E0B]">{highest?.service || '—'}</dd>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] mb-2">Distribución de costos</p>
              {costDistribution.map((c) => (
                <div key={c.name} className="flex justify-between text-xs mb-1">
                  <span className="text-[#64748B]">{c.name}</span>
                  <span className="font-medium text-[#1E293B]">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}