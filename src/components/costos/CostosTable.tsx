import { useState } from 'react';
import { Calculator, Trash2 } from 'lucide-react';
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

const cellInput =
  'w-24 px-2 py-1 rounded-md border border-border bg-card text-text-main text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]';

export default function CostosTable({ rows, totalMonthly, onUpdateRow, onRemoveRow }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-4 shrink-0">
        <h2 className="text-sm font-semibold text-text-main">Planificación de costos</h2>
        <span className="text-xs text-text-secondary">
          {rows.length} {rows.length === 1 ? 'recurso' : 'recursos'}
        </span>
      </div>

      {/* Zona de la tabla: ocupa todo el alto disponible y hace scroll solo si hace falta */}
      <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1 max-h-[460px] xl:max-h-none">
        {rows.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center gap-2 px-6">
            <Calculator className="w-8 h-8 text-text-secondary opacity-40" />
            <p className="text-sm font-medium text-text-main">Aún no hay recursos</p>
            <p className="text-xs text-text-secondary max-w-xs">
              Agrega uno desde el formulario o aplica una planificación desde la sección Planificación.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[560px] text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs text-text-secondary">
                <th className="sticky top-0 z-10 bg-card border-b border-border pb-2.5 pr-3 font-medium whitespace-nowrap">Servicio</th>
                <th className="sticky top-0 z-10 bg-card border-b border-border pb-2.5 pr-3 font-medium text-right whitespace-nowrap">Cantidad</th>
                <th className="sticky top-0 z-10 bg-card border-b border-border pb-2.5 pr-3 font-medium text-right whitespace-nowrap">Horas</th>
                <th className="sticky top-0 z-10 bg-card border-b border-border pb-2.5 pr-3 font-medium text-right whitespace-nowrap">Tarifa</th>
                <th className="sticky top-0 z-10 bg-card border-b border-border pb-2.5 pr-3 font-medium text-right whitespace-nowrap">Mensual</th>
                <th className="sticky top-0 z-10 bg-card border-b border-border pb-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 pr-3 border-b border-border font-medium text-text-main whitespace-nowrap">{row.service}</td>
                  <td className="py-2 pr-3 border-b border-border text-right">
                    <NumInput
                      min={1}
                      value={row.quantity}
                      onChange={(v) => onUpdateRow(row.id, 'quantity', v)}
                      className={cellInput}
                    />
                  </td>
                  <td className="py-2 pr-3 border-b border-border text-right">
                    <NumInput
                      value={row.hours}
                      onChange={(v) => onUpdateRow(row.id, 'hours', v)}
                      className={cellInput}
                    />
                  </td>
                  <td className="py-2 pr-3 border-b border-border text-right text-text-secondary tabular-nums whitespace-nowrap">
                    ${row.rate}
                  </td>
                  <td className="py-2 pr-3 border-b border-border text-right font-medium text-text-main tabular-nums whitespace-nowrap">
                    ${row.monthly.toFixed(2)}
                  </td>
                  <td className="py-2 border-b border-border text-right">
                    <button
                      onClick={() => onRemoveRow(row.id)}
                      aria-label={`Eliminar ${row.service}`}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-text-secondary hover:text-[#DC2626] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Total siempre visible al pie de la tarjeta */}
      <div className="shrink-0 mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
        <span className="font-medium text-text-secondary">Total mensual</span>
        <span className="font-semibold text-text-main tabular-nums">${totalMonthly.toFixed(2)}</span>
      </div>
    </div>
  );
}