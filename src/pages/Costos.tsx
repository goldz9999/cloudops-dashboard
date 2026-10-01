import { useCallback, useEffect, useState, type SetStateAction } from 'react';
import { DollarSign, TrendingUp, Server, Loader2 } from 'lucide-react';
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
import { api } from '../api/client';
import { fetchRegionCosts } from '../api/proposals';

export default function Costos() {
  const { region } = useRegion();
  return (
    <CostosContent
      key={region.id}
      regionId={region.id}
      regionText={`${region.id} — ${regionLabel(region)}`}
    />
  );
}

function CostosContent({ regionId, regionText }: { regionId: string; regionText: string }) {
  const { notify } = useNotifications();
  const { region } = useRegion();

  const [rows, setRowsState] = useState<CostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('planning');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRegionCosts(regionId);
      setRowsState(data.rows || []);
      setSource(data.source || 'planning');
    } catch (e) {
      setRowsState([]);
      notify({
        type: 'error',
        title: 'No se pudieron cargar los costos',
        message: e instanceof Error ? e.message : 'Error del backend',
      });
    } finally {
      setLoading(false);
    }
  }, [regionId, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (next: CostRow[]) => {
    try {
      await api(`/costs/${regionId}/rows`, {
        method: 'PUT',
        body: JSON.stringify({ rows: next }),
      });
      setSource('custom');
    } catch (e) {
      notify({
        type: 'error',
        title: 'No se guardaron los costos en Supabase',
        message: e instanceof Error ? e.message : 'Error del backend',
      });
    }
  };

  const setRows = (update: SetStateAction<CostRow[]>) => {
    setRowsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      void persist(next);
      return next;
    });
  };

  const [form, setForm] = useState<CostForm>({ service: 'EC2', quantity: 1, hours: 730, rate: 0.0528 });

  const totalMonthly = rows.reduce((sum, r) => sum + r.monthly, 0);
  const totalAnnual = totalMonthly * 12;
  const highest = rows.length ? rows.reduce((max, r) => (r.monthly > max.monthly ? r : max), rows[0]) : null;

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
    const newId = Math.max(0, ...rows.map((r) => r.id)) + 1;
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
    notify({ type: 'success', title: 'Recurso agregado', message: `${form.service} — $${monthly.toFixed(2)}/mes.` });
  };

  const removeRow = (id: number) => {
    const removed = rows.find((r) => r.id === id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (removed) {
      notify({
        type: 'info',
        title: 'Recurso eliminado',
        message: `Se quitó ${removed.service} de la tabla de costos.`,
      });
    }
  };

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
  const barData = costByService.map((c) => ({ name: c.name, monthly: c.value, annual: +(c.value * 12).toFixed(2) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Costos</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Desde planificaciones (Supabase). Región:{' '}
            <span className="font-medium text-text-main">{regionText}</span>
            {source ? ` · fuente: ${source}` : ''}
          </p>
        </div>
        <ExportMenu getReport={() => buildCostReport(region, rows)} />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando costos…
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-5 text-sm text-text-secondary">
          No hay costos para esta región. En <strong>Planificación</strong> crea una propuesta y pulsa{' '}
          <strong>Aplicar a costos</strong>, o agrega recursos abajo.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Costo mensual', value: `$${totalMonthly.toFixed(2)}`, icon: DollarSign, color: 'text-[#F59E0B]' },
          {
            label: 'Costo anual',
            value: `$${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            icon: TrendingUp,
            color: 'text-[#F59E0B]',
          },
          { label: 'Servicios utilizados', value: rows.length, icon: Server, color: 'text-[#2563EB]' },
          { label: 'Recurso de mayor costo', value: highest?.service || '—', icon: DollarSign, color: 'text-[#DC2626]' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-4 min-w-0">
              <Icon className={`w-4 h-4 ${kpi.color} mb-2`} />
              <p className="text-xl font-semibold text-text-main truncate">{kpi.value}</p>
              <p className="text-xs text-text-secondary mt-0.5 truncate">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* En pantallas grandes la tarjeta toma el alto de la columna derecha (sin espacio vacío debajo) */}
        <div className="xl:col-span-2 min-w-0 xl:relative xl:min-h-[420px]">
          <div className="xl:absolute xl:inset-0">
            <CostosTable rows={rows} totalMonthly={totalMonthly} onUpdateRow={updateRow} onRemoveRow={removeRow} />
          </div>
        </div>
        <div className="space-y-4 min-w-0">
          <CostosForm
            form={form}
            onServiceChange={handleServiceChange}
            onFieldChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
            onAdd={addRow}
          />
          <CostosSummary
            totalMonthly={totalMonthly}
            totalAnnual={totalAnnual}
            highestService={highest?.service}
            costDistribution={costDistribution}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CostosCharts costDistribution={costDistribution} barData={barData} />
      </div>
    </div>
  );
}