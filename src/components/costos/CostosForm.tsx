import { Plus } from 'lucide-react';
import { NumInput } from './CostosTable';
import Select from '../common/Select';
import { SERVICE_OPTIONS } from './costoData';
import { rate, usd } from './costFormat';

export interface CostForm {
  service: string;
  quantity: number;
  hours: number;
  rate: number;
}

interface Props {
  form: CostForm;
  onServiceChange: (name: string) => void;
  onFieldChange: (field: 'quantity' | 'hours', value: number) => void;
  onAdd: () => void;
}

const label = 'block text-xs font-medium text-text-secondary mb-1.5';
const field =
  'w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text-main tabular-nums focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30';

export default function CostosForm({ form, onServiceChange, onFieldChange, onAdd }: Props) {
  const formMonthly = +(form.quantity * form.hours * form.rate).toFixed(2);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-main mb-4">Agregar recurso</h2>
      <div className="space-y-3">
        <div>
          <label className={label}>Servicio</label>
          <Select
            ariaLabel="Servicio"
            value={form.service}
            onChange={onServiceChange}
            options={SERVICE_OPTIONS.map((opt) => ({ value: opt.name, label: opt.name }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Cantidad</label>
            <NumInput min={1} value={form.quantity} onChange={(v) => onFieldChange('quantity', v)} className={field} ariaLabel="Cantidad" />
          </div>
          <div>
            <label className={label}>Horas</label>
            <NumInput value={form.hours} onChange={(v) => onFieldChange('hours', v)} className={field} ariaLabel="Horas" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} title="Tarifa fija según el servicio">Tarifa ($/h)</label>
            <div className={`${field} flex items-center bg-slate-50 dark:bg-slate-800/50 text-text-secondary cursor-not-allowed`}>
              {rate(form.rate)}
            </div>
          </div>
          <div>
            <label className={label}>Costo estimado</label>
            <div className={`${field} flex items-center justify-end font-semibold bg-blue-50/60 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30`}>
              {usd(formMonthly)}
            </div>
          </div>
        </div>

        <button
          onClick={onAdd}
          className="w-full h-9 flex items-center justify-center gap-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar a la calculadora
        </button>
      </div>
    </div>
  );
}