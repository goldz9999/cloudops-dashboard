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
import { COST_COLORS, usd, type CostSlice } from '../components/costos/costFormat';
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

  // Por servicio, de mayor a menor costo; cada servicio tiene un color fijo en toda la vista
  const costByService = Object.values(
    rows.reduce<Record<string, { name: string; value: number }>>((acc, r) => {
      acc[r.service] = { name: r.service, value: +((acc[r.service]?.value ?? 0) + r.monthly).toFixed(2) };
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);
  const costDistribution: CostSlice[] = costByService.map((c, i) => ({
    ...c,
    percentage: totalMonthly ? Math.round((c.value / totalMonthly) * 100) : 0,
    color: COST_COLORS[i % COST_COLORS.length],
  }));
  const colorOf = (service: string) => costDistribution.find((c) => c.name === service)?.color ?? '#94A3B8';

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Costo mensual', value: usd(totalMonthly), icon: DollarSign, color: 'text-[#F59E0B] bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Costo anual', value: usd(totalAnnual), icon: TrendingUp, color: 'text-[#F59E0B] bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Servicios utilizados', value: String(rows.length), icon: Server, color: 'text-[#2563EB] bg-blue-50 dark:bg-blue-500/10' },
          {
            label: 'Recurso de mayor costo',
            value: highest?.service || '—',
            hint: highest ? usd(highest.monthly) : undefined,
            icon: DollarSign,
            color: 'text-[#DC2626] bg-red-50 dark:bg-red-500/10',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-4 min-w-0 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${kpi.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-secondary truncate">{kpi.label}</p>
                <p className="text-lg font-semibold text-text-main truncate tabular-nums">
                  {kpi.value}
                  {kpi.hint && <span className="ml-1.5 text-xs font-normal text-text-secondary">{kpi.hint}</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Columna izquierda: tabla y debajo los gráficos. Columna derecha (fija): agregar recurso + resumen.
          En pantallas pequeñas el orden es tabla → formulario → gráficos. */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] xl:grid-rows-[auto_1fr] gap-4 items-start">
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          <CostosTable rows={rows} totalMonthly={totalMonthly} colorOf={colorOf} onUpdateRow={updateRow} onRemoveRow={removeRow} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 min-w-0 xl:col-start-2 xl:row-start-1 xl:row-span-2">
          <CostosForm
            form={form}
            onServiceChange={handleServiceChange}
            onFieldChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
            onAdd={addRow}
          />
          <CostosSummary
            totalMonthly={totalMonthly}
            totalAnnual={totalAnnual}
            highest={highest}
            costDistribution={costDistribution}
          />
        </div>
        <div className="min-w-0 xl:col-start-1 xl:row-start-2">
          <CostosCharts costDistribution={costDistribution} totalMonthly={totalMonthly} />
        </div>
      </div>
    </div>
  );
}