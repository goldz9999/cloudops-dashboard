import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleHelp, ShieldCheck, XCircle } from 'lucide-react';
import { fetchErpSecurity, type ErpSecurityReport } from '../../api/erpSecurity';
import type { CheckStatus } from '../../api/security';

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

const scoreColor = (n: number) => (n >= 90 ? 'text-[#16A34A]' : n >= 75 ? 'text-[#F59E0B]' : 'text-[#DC2626]');
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
        <div className="bg-card rounded-xl border border-border p-5">
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> Seguridad del ERP EnterpriseCloud
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-green-200 dark:border-green-500/30 text-[#16A34A]">
                        Datos reales
                    </span>
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                    Pruebas de solo lectura hechas desde Backencito contra el API del ERP{report?.erpUrl ? ` (${report.erpUrl})` : ''}. No usan credenciales.
                </p>
            </div>

            {error && <p className="text-sm text-[#DC2626]">No se pudo obtener el informe: {error}</p>}

            {!error && loading && !report && <p className="text-sm text-text-secondary">Midiendo la seguridad del ERP…</p>}

            {report && !report.configured && (
                <p className="text-sm text-text-secondary">
                    Falta configurar el ERP: agrega <code className="font-mono text-xs">ERP_API_URL=http://localhost:8000/api/v1</code> al
                    <code className="font-mono text-xs"> .env</code> de Backencito y reinícialo.
                </p>
            )}

            {report?.configured && (
                <>
                    <div className="flex items-center gap-4 mb-4">
                        <div>
                            <p className="text-xs text-text-secondary">Puntaje del ERP</p>
                            <p className={`text-3xl font-semibold tabular-nums ${report.reachable ? scoreColor(report.score) : 'text-text-secondary'}`}>
                                {report.reachable ? report.score : '—'}
                                <span className="text-sm font-normal text-text-secondary"> / 100</span>
                            </p>
                        </div>
                        <div className="text-xs text-text-secondary">
                            {report.checkedAt && <p>Medido: {when(report.checkedAt)}</p>}
                            {!report.reachable && <p className="text-[#DC2626]">El ERP no responde: enciende su backend y vuelve a medir.</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.groups.map((g) => (
                            <div key={g.id} className="rounded-lg border border-border p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-text-main">{g.label}</h3>
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge[g.status]}`}>{label[g.status]}</span>
                                </div>
                                <ul className="divide-y divide-border">
                                    {g.checks.map((c) => (
                                        <li key={c.id} className="flex items-start gap-2 py-2 first:pt-0 last:pb-0">
                                            <span className="mt-0.5 shrink-0">{icon[c.status]}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm text-text-main">{c.label}</p>
                                                <p className="text-xs text-text-secondary">{c.detail}</p>
                                                {c.recommendation && c.status !== 'healthy' && (
                                                    <p className="text-xs text-primary mt-0.5">→ {c.recommendation}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}