import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CostRow } from '../../data/regionData';

interface NumInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  className?: string;
}

// Input numérico que permite borrar el contenido mientras se escribe.
// Mantiene el texto localmente y solo propaga números válidos; al salir del campo
// (blur) restaura el último valor válido si quedó vacío.
export function NumInput({ value, onChange, min = 0, className }: NumInputProps) {
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

interface Props {
  rows: CostRow[];
  totalMonthly: number;
  onUpdateRow: (id: number, field: keyof CostRow, value: number) => void;
  onRemoveRow: (id: number) => void;
}

export default function CostosTable({ rows, totalMonthly, onUpdateRow, onRemoveRow }: Props) {
  return (
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
                    onChange={(v) => onUpdateRow(row.id, 'quantity', v)}
                    className="w-20 px-2 py-1 rounded border border-border text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </td>
                <td className="py-2 pr-3 text-right">
                  <NumInput
                    value={row.hours}
                    onChange={(v) => onUpdateRow(row.id, 'hours', v)}
                    className="w-20 px-2 py-1 rounded border border-border text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </td>
                <td className="py-2.5 pr-3 text-right text-text-secondary tabular-nums">${row.rate}</td>
                <td className="py-2.5 pr-3 text-right font-medium text-text-main">${row.monthly.toFixed(2)}</td>
                <td className="py-2">
                  <button
                    onClick={() => onRemoveRow(row.id)}
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
              <td className="pt-3 text-right text-sm font-semibold text-text-main">${totalMonthly.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}