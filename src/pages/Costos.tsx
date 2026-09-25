import { useState, type SetStateAction } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { DollarSign, TrendingUp, Server } from 'lucide-react';
import { useRegion } from '../context/useRegion';
import { useNotifications } from '../context/useNotifications';
import { regionLabel, type CostRow } from '../data/regionData';
import ExportMenu from '../components/common/ExportMenu';
import { buildCostReport } from '../utils/reportBuilders';
import CostosTable from '../components/costos/CostosTable';
import CostosForm, { type CostForm } from '../components/costos/CostosForm';
import { SERVICE_OPTIONS } from '../components/costos/costoData';
import CostosCharts from '../components/costos/CostosCharts';
import CostosSummary from '../components/costos/CostosSummary';

// Al cambiar de región se vuelve a montar con los costos de esa región (key)
export default function Costos() {
  const { region } = useRegion();
  return <CostosContent key={region.id} initialData={region.costTable} regionText={`${region.id} — ${regionLabel(region)}`} />;
}

const isCostRow = (r: unknown): r is CostRow =>
  typeof r === 'object' &&
  r !== null &&
  ['id', 'quantity', 'hours', 'rate', 'monthly'].every((k) => typeof (r as Record<string, unknown>)[k] === 'number') &&
  typeof (r as Record<string, unknown>).service === 'string';

const isRowsByRegion = (v: unknown): v is Record<string, CostRow[]> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.values(v).every((rows) => Array.isArray(rows) && rows.every(isCostRow));

function CostosContent({ initialData, regionText }: { initialData: CostRow[]; regionText: string }) {
  const { notify } = useNotifications();
  const { region } = useRegion();

  // Las ediciones de la tabla se guardan por región; si no hay ediciones, se usan los datos base.
  const [storedRows, setStoredRows] = usePersistentState<Record<string, CostRow[]>>('costos-rows', {}, isRowsByRegion);
  const rows = storedRows[region.id] ?? initialData;
  const setRows = (update: SetStateAction<CostRow[]>) =>
    setStoredRows((prev) => {
      const current = prev[region.id] ?? initialData;
      return { ...prev, [region.id]: typeof update === 'function' ? update(current) : update };
    });

  const [form, setForm] = useState<CostForm>({ service: 'EC2', quantity: 1, hours: 730, rate: 0.0528 });

  const totalMonthly = rows.reduce((sum, r) => sum + r.monthly, 0);
  const totalAnnual = totalMonthly * 12;
  const highest = rows.length ? rows.reduce((max, r) => (r.monthly > max.monthly ? r : max), rows[0]) : null;

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
    setForm((prev) => ({ ...prev, service: serviceName, rate: opt?.rate ?? 0.01, hours: opt?.hours ?? 730 }));
  };

  const addRow = () => {
    const newId = Math.max(...rows.map((r) => r.id), 0) + 1;
    const monthly = +(form.quantity * form.hours * form.rate).toFixed(2);
    setRows((prev) => [...prev, { id: newId, service: form.service, quantity: form.quantity, hours: form.hours, rate: form.rate, monthly }]);
    notify({ type: 'success', title: 'Recurso agregado', message: `${form.service} — $${monthly.toFixed(2)}/mes.` });
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

  const barData = rows.map((r) => ({ name: r.service, monthly: r.monthly, annual: +(r.monthly * 12).toFixed(2) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Costos</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Análisis financiero y calculadora de costos de la infraestructura Cloud en{' '}
            <span className="font-medium text-text-main">{regionText}</span>
          </p>
        </div>
        <ExportMenu getReport={() => buildCostReport(region, rows)} />
      </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <CostosTable rows={rows} totalMonthly={totalMonthly} onUpdateRow={updateRow} onRemoveRow={removeRow} />
        <CostosForm
          form={form}
          onServiceChange={handleServiceChange}
          onFieldChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
          onAdd={addRow}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CostosCharts costDistribution={costDistribution} barData={barData} />
        <CostosSummary
          totalMonthly={totalMonthly}
          totalAnnual={totalAnnual}
          highestService={highest?.service ?? ''}
          costDistribution={costDistribution}
        />
      </div>
    </div>
  );
}