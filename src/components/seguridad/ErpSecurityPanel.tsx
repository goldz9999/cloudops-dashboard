import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleHelp, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { fetchErpSecurity, type ErpSecurityReport } from '../../api/erpSecurity';
import type { CheckStatus } from '../../api/security';
import { iconTile, scoreColor } from './securityHelpers';
import { Chip, ScoreRing } from './securityUi';

const icon: Record<CheckStatus, React.ReactNode> = {
    healthy: <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />,
    review: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
    issue: <XCircle className="w-4 h-4 text-[#DC2626]" />,
    unknown: <CircleHelp className="w-4 h-4 text-text-secondary" />,
};

const badge: Record<CheckStatus, string> = {
    healthy: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
    review: 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706] border-amber-200 dark:border-amber-500/30',
    issue: 'bg-red-50 dark:bg-red-500/10 text-[#DC2626] border-red-200 dark:border-red-500/30',
    unknown: 'border-border text-text-secondary',
};

const label: Record<CheckStatus, string> = { healthy: 'Correcto', review: 'Revisar', issue: 'Problema', unknown: 'Sin medir' };
const stripe: Record<CheckStatus, string> = { healthy: 'bg-[#16A34A]', review: 'bg-[#F59E0B]', issue: 'bg-[#DC2626]', unknown: 'bg-border' };

const when = (iso: string) => new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' });

/** Medición técnica del ERP. El botón «Medir de nuevo» vive en ErpSecurityTab y llega aquí como refreshKey. */
export default function ErpSecurityPanel({ refreshKey = 0 }: { refreshKey?: number }) {
    const [report, setReport] = useState<ErpSecurityReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (refresh: boolean) => {
        setLoading(true);
        setError(null);
        try {
            setReport(await fetchErpSecurity(refresh));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo consultar Backencito.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load(refreshKey > 0);
    }, [load, refreshKey]);

    return (
        <div className="bg-card rounded-xl border border-border p-5 space-y-5">
            <div className="flex items-start gap-3">
                <span className={`${iconTile} bg-primary/10 text-primary`}>
                    <ShieldCheck className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-text-main flex flex-wrap items-center gap-2">
                        Seguridad del ERP EnterpriseCloud
                        <Chip tone="ok">Datos reales</Chip>
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5 max-w-3xl">
                        Pruebas de solo lectura hechas desde Backencito contra el API del ERP{report?.erpUrl ? ` (${report.erpUrl})` : ''}. No usan credenciales.
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-[#DC2626]">
                    No se pudo obtener el informe: {error}
                </div>
            )}

            {!error && loading && !report && (
                <div className="space-y-3" aria-busy="true">
                    <p className="text-sm text-text-secondary">Midiendo la seguridad del ERP…</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-32 rounded-xl border border-border bg-border/30 animate-pulse" />
                        ))}
                    </div>
                </div>
            )}

            {report && !report.configured && (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary">
                    Falta configurar el ERP: agrega <code className="font-mono text-xs px-1 py-0.5 rounded bg-border/50">ERP_API_URL=http://localhost:8000/api/v1</code> al{' '}
                    <code className="font-mono text-xs px-1 py-0.5 rounded bg-border/50">.env</code> de Backencito y reinícialo.
                </div>
            )}

            {report?.configured && (
                <>
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-bg-main/40 p-4">
                        {report.reachable ? (
                            <ScoreRing value={report.score} size={72} />
                        ) : (
                            <div className="grid place-items-center w-[72px] h-[72px] rounded-full border-4 border-border text-xl text-text-secondary">—</div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs text-text-secondary">Puntaje del ERP</p>
                            <p className={`text-3xl font-semibold tabular-nums leading-tight ${report.reachable ? scoreColor(report.score) : 'text-text-secondary'}`}>
                                {report.reachable ? report.score : '—'}
                                <span className="text-sm font-normal text-text-secondary"> / 100</span>
                            </p>
                        </div>
                        <div className="ml-auto text-xs text-text-secondary space-y-1">
                            {report.checkedAt && (
                                <p className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> Medido: {when(report.checkedAt)}
                                </p>
                            )}
                            {!report.reachable && <p className="text-[#DC2626]">El ERP no responde: enciende su backend y vuelve a medir.</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {report.groups.map((g, gi) => {
                            const healthy = g.checks.filter((c) => c.status === 'healthy').length;
                            return (
                                <article
                                    key={g.id}
                                    className="relative overflow-hidden rounded-xl border border-border bg-card p-4 pl-5 animate-page-in transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30"
                                    style={{ animationDelay: `${gi * 55}ms` }}
                                >
                                    <span className={`absolute inset-y-0 left-0 w-1 ${stripe[g.status]}`} aria-hidden="true" />
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-text-main">{g.label}</h3>
                                            <p className="text-[11px] text-text-secondary tabular-nums">
                                                {healthy} de {g.checks.length} correctas
                                            </p>
                                        </div>
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${badge[g.status]}`}>{label[g.status]}</span>
                                    </div>
                                    <ul className="divide-y divide-border">
                                        {g.checks.map((c) => (
                                            <li key={c.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                                                <span className="mt-0.5 shrink-0">{icon[c.status]}</span>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-text-main">{c.label}</p>
                                                    <p className="text-xs text-text-secondary leading-relaxed">{c.detail}</p>
                                                    {c.recommendation && c.status !== 'healthy' && (
                                                        <p className="mt-1 inline-block rounded-md bg-primary/5 px-2 py-1 text-xs text-primary">→ {c.recommendation}</p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}