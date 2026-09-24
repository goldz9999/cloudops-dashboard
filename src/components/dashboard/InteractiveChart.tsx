import { useState } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useRegion } from '../../context/useRegion';
import { regionLabel } from '../../data/regionData';
import { services as catalog } from '../../data/mockData';
import { buildCostTrend, buildUsageData, colorFor, costByService, type TrendRow } from '../../utils/chartData';

type Tab = 'trend' | 'cost' | 'usage';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'trend', label: 'Tendencia de costos', hint: 'Evolución mensual del costo por servicio. Pulsa un servicio para mostrarlo u ocultarlo.' },
  { id: 'cost', label: 'Costo por servicio', hint: 'Costo mensual actual de cada servicio y su porcentaje del total.' },
  { id: 'usage', label: 'Uso por servicio', hint: 'Porcentaje de uso de los servicios desplegados. Se marca en rojo por encima del 80 %.' },
];

const usd = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface TipItem {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, number | string>;
}
interface TipProps {
  active?: boolean;
  payload?: readonly TipItem[];
  label?: string | number;
  mode: Tab;
  total?: number;
}

function ChartTooltip({ active, payload, label, mode, total = 0 }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload ?? {};
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs min-w-[150px]">
      <p className="font-semibold text-text-main mb-1 capitalize">
        {mode === 'trend' ? String(p.fullLabel ?? label) : String(label)}
      </p>
      {mode === 'trend' && (
        <>
          {[...payload].reverse().map((it) => (
            <div key={String(it.name)} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />
                {it.name}
              </span>
              <span className="font-medium text-text-main">{usd(Number(it.value))}</span>
            </div>
          ))}
          <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-border">
            <span className="text-text-secondary">Total</span>
            <span className="font-semibold text-text-main">
              {usd(payload.reduce((s, it) => s + Number(it.value), 0))}
            </span>
          </div>
        </>
      )}
      {mode === 'cost' && (
        <>
          <p className="text-text-main font-medium">{usd(Number(payload[0].value))} / mes</p>
          <p className="text-text-secondary">{total ? Math.round((Number(payload[0].value) / total) * 100) : 0}% del total</p>
        </>
      )}
      {mode === 'usage' && (
        <>
          <p className="text-text-main font-medium">Uso: {String(payload[0].value)}%</p>
          <p className="text-text-secondary">Recursos: {String(p.resources)}</p>
        </>
      )}
    </div>
  );
}

export default function InteractiveChart() {
  const { region, summary } = useRegion();
  const [tab, setTab] = usePersistentState<Tab>('chart-tab', 'trend', (v): v is Tab => TABS.some((t) => t.id === v));
  const [hidden, setHidden] = useState<string[]>([]);

  const trend = buildCostTrend(region);
  const costData = costByService(region);
  const usageData = buildUsageData(region, catalog);
  const visible = trend.services.filter((s) => !hidden.includes(s));

  const first = trend.rows[0]?.total ?? 0;
  const last = trend.rows[trend.rows.length - 1]?.total ?? 0;
  const change = first ? Math.round(((last - first) / first) * 100) : 0;

  const toggle = (name: string) =>
    setHidden((h) => (h.includes(name) ? h.filter((x) => x !== name) : [...h, name]));

  const current = TABS.find((t) => t.id === tab)!;
  const axis = { fontSize: 11, fill: 'var(--color-text-secondary)' };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-text-main">Análisis interactivo</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {region.id} — {regionLabel(region)} · {current.hint}
          </p>
        </div>
        <div role="tablist" aria-label="Tipo de gráfico" className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === t.id
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-card border border-border text-text-secondary hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'trend' && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {trend.services.map((s) => {
            const off = hidden.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggle(s)}
                aria-pressed={!off}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                  off ? 'border-border text-slate-400' : 'border-transparent bg-slate-100 text-text-main'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: off ? '#CBD5E1' : colorFor(s) }} />
                {s}
              </button>
            );
          })}
          <span
            className={`ml-auto flex items-center gap-1 text-xs font-medium ${
              change >= 0 ? 'text-[#F59E0B]' : 'text-[#16A34A]'
            }`}
          >
            {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change >= 0 ? '+' : ''}
            {change}% en {trend.rows.length} meses
          </span>
        </div>
      )}

      <div className="h-72 w-full min-w-0" role="img" aria-label={`Gráfico: ${current.label} de ${region.id}`}>
        <ResponsiveContainer width="100%" height="100%">
          {tab === 'trend' ? (
            <AreaChart data={trend.rows as TrendRow[]} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                {trend.services.map((s) => (
                  <linearGradient key={s} id={`g-${s.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colorFor(s)} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={colorFor(s)} stopOpacity={0.12} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={52} />
              <Tooltip content={<ChartTooltip mode="trend" />} cursor={{ stroke: '#94A3B8', strokeDasharray: '4 4' }} />
              {visible.map((s) => (
                <Area
                  key={s}
                  type="monotone"
                  dataKey={s}
                  name={s}
                  stackId="cost"
                  stroke={colorFor(s)}
                  strokeWidth={1.5}
                  fill={`url(#g-${s.replace(/\s/g, '')})`}
                  animationDuration={600}
                />
              ))}
            </AreaChart>
          ) : tab === 'cost' ? (
            <BarChart data={costData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={52} />
              <Tooltip content={<ChartTooltip mode="cost" total={summary.monthlyCost} />} cursor={{ fill: 'rgba(148,163,184,0.15)' }} />
              <Bar dataKey="value" name="Costo mensual" radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={600}>
                {costData.map((c) => (
                  <Cell key={c.name} fill={colorFor(c.name)} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={usageData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={52} />
              <Tooltip content={<ChartTooltip mode="usage" />} cursor={{ fill: 'rgba(148,163,184,0.15)' }} />
              <ReferenceLine y={80} stroke="#DC2626" strokeDasharray="4 4" label={{ value: '80 %', fill: '#DC2626', fontSize: 10, position: 'right' }} />
              <Bar dataKey="usage" name="Uso" radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={600}>
                {usageData.map((u) => (
                  <Cell key={u.name} fill={u.usage >= 80 ? '#DC2626' : u.usage >= 70 ? '#F59E0B' : '#2563EB'} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {tab === 'trend' && visible.length === 0 && (
        <p className="text-xs text-text-secondary text-center mt-2">Selecciona al menos un servicio para ver la tendencia.</p>
      )}
    </div>
  );
}