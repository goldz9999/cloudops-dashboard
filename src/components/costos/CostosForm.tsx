import { Plus } from 'lucide-react';
import { NumInput } from './CostosTable';
import Select from '../common/Select';
import { SERVICE_OPTIONS } from './costoData';

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

export default function CostosForm({ form, onServiceChange, onFieldChange, onAdd }: Props) {
  const formMonthly = +(form.quantity * form.hours * form.rate).toFixed(2);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-main mb-4">Agregar recurso</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Servicio</label>
          <Select
            ariaLabel="Servicio"
            value={form.service}
            onChange={onServiceChange}
            options={SERVICE_OPTIONS.map((opt) => ({ value: opt.name, label: opt.name }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Cantidad</label>
          <NumInput
            min={1}
            value={form.quantity}
            onChange={(v) => onFieldChange('quantity', v)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Horas</label>
          <NumInput
            value={form.hours}
            onChange={(v) => onFieldChange('hours', v)}
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
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar a la calculadora
        </button>
      </div>
    </div>
  );
}