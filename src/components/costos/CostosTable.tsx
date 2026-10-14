import { useState } from 'react';
import { Calculator, Trash2 } from 'lucide-react';
import type { CostRow } from '../../data/regionData';
import { rate, usd } from './costFormat';

interface NumInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  className?: string;
  ariaLabel?: string;
}

// Input numérico que permite borrar el contenido mientras se escribe.
// Mantiene el texto localmente y solo propaga números válidos; al salir del campo
// (blur) restaura el último valor válido si quedó vacío.
export function NumInput({ value, onChange, min = 0, className, ariaLabel }: NumInputProps) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      aria-label={ariaLabel}
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
  colorOf: (service: string) => string;
  onUpdateRow: (id: number, field: keyof CostRow, value: number) => void;
  onRemoveRow: (id: number) => void;
}

const cellInput =
  'w-full h-8 px-2 rounded-md border border-border bg-card text-text-main text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]';
/** A partir de esta cantidad de filas la tabla hace scroll interno (encabezado y total fijos). */
const MAX_VISIBLE_ROWS = 6;
const ROW_HEIGHT = 49; // py-2 + input h-8 + borde
const HEAD_HEIGHT = 37;
const FOOT_HEIGHT = 37;

// Fondo sólido para que las filas no se vean a través del encabezado/total fijos
// (equivale a slate-800/40 sobre el color de la tarjeta en modo oscuro)
const stickyBg = 'bg-slate-50 dark:bg-[#161F2F]';
const th = `py-2.5 px-3 font-medium text-xs text-text-secondary whitespace-nowrap sticky top-0 z-10 ${stickyBg}`;
const td = 'py-2 px-3 border-t border-border';
// La sombra superior marca el borde del total fijo cuando las filas pasan por debajo
const foot = `py-2 px-3 sticky bottom-0 z-10 ${stickyBg} shadow-[inset_0_1px_0_var(--color-border)]`;

export default function CostosTable({ rows, totalMonthly, colorOf, onUpdateRow, onRemoveRow }: Props) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-text-main">Planificación de costos</h2>
        <span className="text-xs text-text-secondary">
          {rows.length} {rows.length === 1 ? 'recurso' : 'recursos'}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-2 px-6 py-12 border-t border-border">
          <Calculator className="w-8 h-8 text-text-secondary opacity-40" />
          <p className="text-sm font-medium text-text-main">Aún no hay recursos</p>
          <p className="text-xs text-text-secondary max-w-xs">
            Agrega uno desde el formulario o aplica una planificación desde la sección Planificación.
          </p>
        </div>
      ) : (
        <div
          className="overflow-auto"
          style={
            rows.length > MAX_VISIBLE_ROWS
              ? { maxHeight: HEAD_HEIGHT + MAX_VISIBLE_ROWS * ROW_HEIGHT + FOOT_HEIGHT }
              : undefined
          }
        >
          <table className="w-full min-w-[640px] table-fixed text-sm">
            <colgroup>
              <col />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-28" />
              <col className="w-32" />
              <col className="w-12" />
            </colgroup>
            <thead>
              <tr>
                <th className={`${th} text-left pl-5`}>Servicio</th>
                <th className={`${th} text-right`}>Cantidad</th>
                <th className={`${th} text-right`}>Horas</th>
                <th className={`${th} text-right`}>Tarifa</th>
                <th className={`${th} text-right`}>Mensual</th>
                <th className={`${th} text-left`}>% del total</th>
                <th className={th}><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const pct = totalMonthly ? (row.monthly / totalMonthly) * 100 : 0;
                return (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className={`${td} pl-5`}>
                      <span className="flex items-center gap-2 font-medium text-text-main truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorOf(row.service) }} />
                        {row.service}
                      </span>
                    </td>
                    <td className={td}>
                      <NumInput min={1} value={row.quantity} onChange={(v) => onUpdateRow(row.id, 'quantity', v)} className={cellInput} ariaLabel={`Cantidad de ${row.service}`} />
                    </td>
                    <td className={td}>
                      <NumInput value={row.hours} onChange={(v) => onUpdateRow(row.id, 'hours', v)} className={cellInput} ariaLabel={`Horas de ${row.service}`} />
                    </td>
                    <td className={`${td} text-right text-text-secondary tabular-nums`}>{rate(row.rate)}</td>
                    <td className={`${td} text-right font-semibold text-text-main tabular-nums`}>{usd(row.monthly)}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colorOf(row.service) }} />
                        </div>
                        <span className="w-9 text-right text-xs text-text-secondary tabular-nums">{Math.round(pct)}%</span>
                      </div>
                    </td>
                    <td className={`${td} text-center`}>
                      <button
                        onClick={() => onRemoveRow(row.id)}
                        aria-label={`Eliminar ${row.service}`}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-text-secondary hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className={`${foot} pl-5 font-medium text-text-secondary`}>Total mensual</td>
                <td className={`${foot} text-right font-semibold text-text-main tabular-nums`}>{usd(totalMonthly)}</td>
                <td colSpan={2} className={foot} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}