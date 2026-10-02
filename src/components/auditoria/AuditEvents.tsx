import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Loader2, RefreshCw, X, CheckCircle2, AlertTriangle, XCircle, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Select from '../common/Select';
import { fetchProposals } from '../../api/proposals';
import { buildAuditEvents, type AuditEvent, type AuditResult } from '../../data/auditMock';

const PAGE = 15;
const ALL = '__all';

const resultBadge: Record<AuditResult, string> = {
    Success: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
    Warning: 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706] border-amber-200 dark:border-amber-500/30',
    Failed: 'bg-red-50 dark:bg-red-500/10 text-[#DC2626] border-red-200 dark:border-red-500/30',
};
const resultText: Record<AuditResult, string> = { Success: 'Exitoso', Warning: 'Advertencia', Failed: 'Fallido' };

const actionBadge: Record<AuditEvent['action'], string> = {
    CREATE: 'text-[#16A34A] bg-green-50 dark:bg-green-500/10',
    UPDATE: 'text-[#2563EB] bg-blue-50 dark:bg-blue-500/10',
    DELETE: 'text-[#DC2626] bg-red-50 dark:bg-red-500/10',
    LOGIN: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
    REVIEW: 'text-[#8B5CF6] bg-purple-50 dark:bg-purple-500/10',
    ALERT: 'text-[#D97706] bg-amber-50 dark:bg-amber-500/10',
};

const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-main)',
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', { hour12: false });
const options = (values: string[], all: string) => [{ value: ALL, label: all }, ...values.map((v) => ({ value: v, label: v }))];
const uniq = (list: string[]) => [...new Set(list)].sort((a, b) => a.localeCompare(b));

/** Estado de un filtro que, al cambiar, avisa (para volver a la primera página). */
function useFilter(initial: string, onChange: () => void) {
    const [value, set] = useState(initial);
    return [value, (v: string) => { set(v); onChange(); }] as const;
}

export default function AuditEvents() {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [backendError, setBackendError] = useState<string | null>(null);

    const [page, setPage] = useState(0);
    const resetPage = () => setPage(0);
    const [q, setQ] = useFilter('', resetPage);
    const [service, setService] = useFilter(ALL, resetPage);
    const [action, setAction] = useFilter(ALL, resetPage);
    const [region, setRegion] = useFilter(ALL, resetPage);
    const [result, setResult] = useFilter(ALL, resetPage);
    const [from, setFrom] = useFilter('', resetPage);
    const [to, setTo] = useFilter('', resetPage);
    const [selected, setSelected] = useState<AuditEvent | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setBackendError(null);
        try {
            setEvents(buildAuditEvents(await fetchProposals()));
        } catch (e) {
            // Sin backend se muestran igualmente los eventos simulados
            setBackendError(e instanceof Error ? e.message : 'Backend no disponible');
            setEvents(buildAuditEvents([]));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const fromT = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
        const toT = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
        return events.filter((e) => {
            const t = new Date(e.time).getTime();
            return (
                (service === ALL || e.service === service) &&
                (action === ALL || e.action === action) &&
                (region === ALL || e.region === region) &&
                (result === ALL || e.result === result) &&
                t >= fromT &&
                t <= toT &&
                (!needle ||
                    [e.user, e.eventName, e.description, e.service, e.resource, e.region, e.ip].some((f) => f.toLowerCase().includes(needle)))
            );
        });
    }, [events, q, service, action, region, result, from, to]);

    const stats = {
        total: filtered.length,
        success: filtered.filter((e) => e.result === 'Success').length,
        warning: filtered.filter((e) => e.result === 'Warning').length,
        failed: filtered.filter((e) => e.result === 'Failed').length,
    };

    // Actividad de los últimos 14 días (según los filtros activos)
    const perDay = useMemo(() => {
        const days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (13 - i));
            return { key: d.toDateString(), label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), Success: 0, Warning: 0, Failed: 0 };
        });
        const idx = new Map(days.map((d, i) => [d.key, i]));
        for (const e of filtered) {
            const i = idx.get(new Date(e.time).toDateString());
            if (i !== undefined) days[i][e.result] += 1;
        }
        return days;
    }, [filtered]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
    const visible = filtered.slice(page * PAGE, page * PAGE + PAGE);
    const hasFilters = q || service !== ALL || action !== ALL || region !== ALL || result !== ALL || from || to;
    const clear = () => {
        setQ('');
        setService(ALL);
        setAction(ALL);
        setRegion(ALL);
        setResult(ALL);
        setFrom('');
        setTo('');
    };

    const field = 'h-9 px-3 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30';

    return (
        <div className="space-y-4">
            {backendError && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-text-main">
                    No se pudieron leer las planificaciones del backend ({backendError}). Se muestran solo los eventos simulados.
                </div>
            )}

            {/* Indicadores */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Total eventos', value: stats.total, icon: ListChecks, color: 'text-[#2563EB] bg-blue-50 dark:bg-blue-500/10' },
                    { label: 'Exitosos', value: stats.success, icon: CheckCircle2, color: 'text-[#16A34A] bg-green-50 dark:bg-green-500/10' },
                    { label: 'Advertencias', value: stats.warning, icon: AlertTriangle, color: 'text-[#D97706] bg-amber-50 dark:bg-amber-500/10' },
                    { label: 'Fallidos', value: stats.failed, icon: XCircle, color: 'text-[#DC2626] bg-red-50 dark:bg-red-500/10' },
                ].map((k) => {
                    const Icon = k.icon;
                    return (
                        <div key={k.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.color}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary">{k.label}</p>
                                <p className="text-lg font-semibold text-text-main tabular-nums">{k.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Actividad por día */}
            <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-text-main mb-3">Actividad de los últimos 14 días</h2>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={perDay} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} interval="preserveStartEnd" />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                itemStyle={{ color: 'var(--color-text-main)' }}
                                cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
                                formatter={(v, k) => [v, resultText[k as AuditResult]]}
                            />
                            <Bar dataKey="Success" stackId="a" fill="#16A34A" />
                            <Bar dataKey="Warning" stackId="a" fill="#F59E0B" />
                            <Bar dataKey="Failed" stackId="a" fill="#DC2626" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar por usuario, evento, recurso, IP…"
                            className={`${field} w-full pl-9`}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => void load()}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border text-sm text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Actualizar
                        </button>
                        {hasFilters && (
                            <button type="button" onClick={clear} className="inline-flex items-center gap-1 px-3 h-9 rounded-lg text-sm text-text-secondary hover:text-text-main">
                                <X className="w-3.5 h-3.5" /> Limpiar
                            </button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <Select ariaLabel="Servicio" value={service} onChange={setService} options={options(uniq(events.map((e) => e.service)), 'Todos los servicios')} />
                    <Select ariaLabel="Acción" value={action} onChange={setAction} options={options(uniq(events.map((e) => e.action)), 'Todas las acciones')} />
                    <Select ariaLabel="Región" value={region} onChange={setRegion} options={options(uniq(events.map((e) => e.region)), 'Todas las regiones')} />
                    <Select
                        ariaLabel="Resultado"
                        value={result}
                        onChange={setResult}
                        options={[{ value: ALL, label: 'Todos los resultados' }, ...(['Success', 'Warning', 'Failed'] as const).map((r) => ({ value: r, label: resultText[r] }))]}
                    />
                    <input type="date" aria-label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
                    <input type="date" aria-label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} className={field} />
                </div>
            </div>

            {/* Tabla + detalle */}
            <div className={`grid grid-cols-1 gap-4 items-start ${selected ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
                <div className="bg-card rounded-xl border border-border overflow-hidden min-w-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/40">
                                <tr className="text-left text-xs text-text-secondary">
                                    <th className="py-2.5 px-4 font-medium">Fecha / hora</th>
                                    <th className="py-2.5 px-3 font-medium">Usuario</th>
                                    <th className="py-2.5 px-3 font-medium">Acción</th>
                                    <th className="py-2.5 px-3 font-medium">Evento</th>
                                    <th className="py-2.5 px-3 font-medium">Servicio</th>
                                    <th className="py-2.5 px-3 font-medium">Recurso</th>
                                    <th className="py-2.5 px-3 font-medium">Región</th>
                                    <th className="py-2.5 px-3 font-medium">IP</th>
                                    <th className="py-2.5 px-4 font-medium">Resultado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && events.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-10 text-center text-text-secondary">
                                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando eventos…
                                        </td>
                                    </tr>
                                ) : visible.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-10 text-center text-sm text-text-secondary">No hay eventos con esos filtros.</td>
                                    </tr>
                                ) : (
                                    visible.map((e) => (
                                        <tr
                                            key={e.id}
                                            onClick={() => setSelected(e)}
                                            className={`border-t border-border cursor-pointer transition-colors ${selected?.id === e.id ? 'bg-blue-50/70 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                                }`}
                                        >
                                            <td className="py-2 px-4 whitespace-nowrap tabular-nums">
                                                <span className="text-text-main">{fmtTime(e.time)}</span>
                                                <span className="block text-[11px] text-text-secondary">{fmtDate(e.time)}</span>
                                            </td>
                                            <td className="py-2 px-3 text-text-main">{e.user}</td>
                                            <td className="py-2 px-3">
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${actionBadge[e.action]}`}>{e.action}</span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className="text-text-main font-mono text-xs">{e.eventName}</span>
                                                <span className="block text-[11px] text-text-secondary">{e.description}</span>
                                            </td>
                                            <td className="py-2 px-3 text-text-main whitespace-nowrap">{e.service}</td>
                                            <td className="py-2 px-3 text-text-secondary max-w-[180px] truncate" title={e.resource}>{e.resource}</td>
                                            <td className="py-2 px-3 text-text-secondary whitespace-nowrap">{e.region}</td>
                                            <td className="py-2 px-3 text-text-secondary font-mono text-xs whitespace-nowrap">{e.ip}</td>
                                            <td className="py-2 px-4">
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${resultBadge[e.result]}`}>{resultText[e.result]}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-text-secondary">
                        <span>
                            {filtered.length === 0 ? 0 : page * PAGE + 1}–{Math.min((page + 1) * PAGE, filtered.length)} de {filtered.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button type="button" aria-label="Página anterior" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="tabular-nums">
                                {page + 1} / {pages}
                            </span>
                            <button type="button" aria-label="Página siguiente" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {selected && (
                    <aside className="bg-card rounded-xl border border-border p-5 xl:sticky xl:top-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                                <p className="text-xs text-text-secondary">Detalle del evento</p>
                                <h3 className="text-sm font-semibold text-text-main font-mono">{selected.eventName}</h3>
                            </div>
                            <button type="button" aria-label="Cerrar detalle" onClick={() => setSelected(null)} className="p-1 rounded text-text-secondary hover:text-text-main">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${resultBadge[selected.result]}`}>
                            {resultText[selected.result]}
                        </span>
                        <dl className="mt-3 space-y-1.5 text-xs">
                            {[
                                ['Fecha', fmtDate(selected.time)],
                                ['Hora', fmtTime(selected.time)],
                                ['Usuario', selected.user],
                                ['Acción', selected.action],
                                ['Descripción', selected.description],
                                ['Servicio', selected.service],
                                ['Recurso', selected.resource],
                                ['Región', selected.region],
                                ['IP de origen', `${selected.ip} (simulada)`],
                                ['Origen del dato', selected.origin === 'Planificación' ? 'Planificación guardada (backend)' : 'Evento simulado'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-3">
                                    <dt className="text-text-secondary shrink-0">{k}</dt>
                                    <dd className="text-text-main text-right break-words min-w-0">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="text-xs text-text-secondary mt-4 mb-1.5">Registro (JSON)</p>
                        <pre className="text-[11px] leading-relaxed bg-slate-50 dark:bg-slate-900/60 border border-border rounded-lg p-3 overflow-x-auto text-text-main">
                            {JSON.stringify(
                                {
                                    eventTime: selected.time,
                                    eventName: selected.eventName,
                                    eventSource: `${selected.service.toLowerCase().replace(/\s+/g, '')}.amazonaws.com`,
                                    awsRegion: selected.region,
                                    sourceIPAddress: selected.ip,
                                    userIdentity: { userName: selected.user },
                                    requestParameters: { resource: selected.resource, ...selected.details },
                                    result: selected.result,
                                },
                                null,
                                2
                            )}
                        </pre>
                    </aside>
                )}
            </div>
        </div>
    );
}