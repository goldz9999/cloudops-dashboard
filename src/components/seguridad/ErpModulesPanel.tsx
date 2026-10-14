import { useEffect, useState } from 'react';
import { Boxes, Coins, Fingerprint, Target } from 'lucide-react';
import {
    fetchErpModules,
    type ControlState,
    type ErpModulesReport,
    type ModuleControl,
    type ModuleSecurity,
} from '../../api/erpSecurity';

const stateLabel: Record<ControlState, string> = { measured: 'Medido', declared: 'Declarado', gap: 'Brecha' };
const stateBadge: Record<ControlState, string> = {
    measured: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
    declared: 'bg-blue-50 dark:bg-blue-500/10 text-[#2563EB] border-blue-200 dark:border-blue-500/30',
    gap: 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706] border-amber-200 dark:border-amber-500/30',
};

const scoreColor = (n: number) => (n >= 90 ? 'text-[#16A34A]' : n >= 75 ? 'text-[#F59E0B]' : 'text-[#DC2626]');
const barColor = (n: number) => (n >= 90 ? 'bg-[#16A34A]' : n >= 75 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]');
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function ScoreBar({ score, withAws }: { score: number; withAws: number }) {
    return (
        <div>
            <div className="relative h-2 rounded-full bg-border overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-[#2563EB]/25" style={{ width: `${withAws}%` }} />
                <div className={`absolute inset-y-0 left-0 rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
                Actual <span className={`font-semibold ${scoreColor(score)}`}>{score}</span> · con servicios AWS{' '}
                <span className="font-semibold text-text-main">{withAws}</span> · nunca 100
            </p>
        </div>
    );
}

function ControlList({ controls }: { controls: ModuleControl[] }) {
    return (
        <ul className="divide-y divide-border mt-3">
            {controls.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                        <p className="text-sm text-text-main">{c.label}</p>
                        <p className="text-xs text-text-secondary">{c.detail}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${stateBadge[c.state]}`}>
                        {stateLabel[c.state]}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function ModuleCard({ m }: { m: ModuleSecurity }) {
    const gaps = m.controls.filter((c) => c.state === 'gap').length;
    return (
        <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                    <h3 className="text-sm font-medium text-text-main">
                        <span className="text-text-secondary tabular-nums">#{m.rank}</span> {m.label}
                    </h3>
                    <p className="text-xs text-text-secondary">
                        Criticidad {Math.round(m.criticality * 100)} % · {gaps} brecha{gaps === 1 ? '' : 's'} que cubriría AWS
                    </p>
                </div>
                <span className={`text-lg font-semibold tabular-nums ${scoreColor(m.score)}`}>{m.score}</span>
            </div>
            <ScoreBar score={m.score} withAws={m.scoreWithAws} />
            <details className="mt-3 group">
                <summary className="text-xs font-medium text-primary cursor-pointer select-none">Ver controles</summary>
                <ControlList controls={m.controls} />
            </details>
        </div>
    );
}

export default function ErpModulesPanel({ refreshKey = 0 }: { refreshKey?: number }) {
    const [report, setReport] = useState<ErpModulesReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);
        fetchErpModules(refreshKey > 0)
            .then((r) => alive && setReport(r))
            .catch((e) => alive && setError(e instanceof Error ? e.message : 'No se pudo consultar Backencito.'))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [refreshKey]);

    // Sin configurar o sin conexión: el panel de arriba ya explica qué hacer.
    if (!report?.configured || !report.reachable || !report.summary || !report.modules) {
        return error ? (
            <div className="bg-card rounded-xl border border-border p-5 text-sm text-[#DC2626]">
                No se pudo obtener la seguridad por módulo: {error}
            </div>
        ) : loading ? (
            <div className="bg-card rounded-xl border border-border p-5 text-sm text-text-secondary">Analizando módulos del ERP…</div>
        ) : null;
    }

    const { summary, modules, services = [], notes = [], iam } = report;

    return (
        <div className="bg-card rounded-xl border border-border p-5 space-y-5">
            <div>
                <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-[#2563EB]" /> Seguridad por módulo del ERP
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                    Cada módulo se evalúa por separado: qué ya cubre el ERP, qué le falta y qué servicio de AWS lo cubriría, con su costo.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {(['measured', 'declared', 'gap'] as const).map((s) => (
                        <span key={s} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${stateBadge[s]}`}>
                            {stateLabel[s]}
                            {s === 'measured' ? ' · comprobado en vivo' : s === 'declared' ? ' · según el código del ERP' : ' · lo que cubriría AWS'}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-text-secondary">Seguridad actual del sistema</p>
                    <p className={`text-2xl font-semibold tabular-nums mt-1 ${scoreColor(summary.score)}`}>
                        {summary.score}
                        <span className="text-sm font-normal text-text-secondary"> / 100</span>
                    </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-text-secondary">Con los servicios AWS recomendados</p>
                    <p className="text-2xl font-semibold tabular-nums mt-1 text-text-main">
                        {summary.scoreWithAws}
                        <span className="text-sm font-normal text-text-secondary"> / 100</span>
                    </p>
                    <p className="text-[11px] text-text-secondary">Ningún servicio da el 100 %</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-text-secondary flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Necesita más seguridad
                    </p>
                    <p className="text-base font-semibold text-text-main mt-1">{summary.mostNeeded.label}</p>
                    <p className="text-[11px] text-text-secondary">Puntaje actual {summary.mostNeeded.score}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-text-secondary flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" /> Costo mensual estimado
                    </p>
                    <p className="text-2xl font-semibold tabular-nums mt-1 text-text-main">{usd(summary.planCostUsd)}</p>
                    <p className="text-[11px] text-text-secondary">
                        Servicios únicos{summary.planCostPending ? ' · falta cotizar MFA' : ''}
                    </p>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                    Módulos, del que más necesita seguridad al que menos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((m) => (
                        <ModuleCard key={m.id} m={m} />
                    ))}
                </div>
            </div>

            {iam && (
                <div className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                            <h3 className="text-sm font-medium text-text-main flex items-center gap-2">
                                <Fingerprint className="w-4 h-4 text-[#2563EB]" /> Identidad y acceso (IAM)
                            </h3>
                            <p className="text-xs text-text-secondary">Eje aparte: se mide por separado de la seguridad de los módulos.</p>
                        </div>
                        <span className={`text-lg font-semibold tabular-nums ${scoreColor(iam.score)}`}>{iam.score}</span>
                    </div>
                    <ScoreBar score={iam.score} withAws={iam.scoreWithAws} />
                    <ControlList controls={iam.controls} />
                </div>
            )}

            <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                    Qué se compraría a AWS, cuánto cuesta y qué efecto tiene
                </h3>
                <div className="overflow-x-auto -mx-1 px-1">
                    <table className="w-full min-w-[820px] text-sm">
                        <thead>
                            <tr className="text-left text-xs text-text-secondary border-b border-border">
                                <th className="pb-2 pr-3 font-medium">Servicio</th>
                                <th className="pb-2 pr-3 font-medium">Cubre</th>
                                <th className="pb-2 pr-3 font-medium w-40">Costo / mes (estimado)</th>
                                <th className="pb-2 font-medium">Efecto colateral</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((s) => (
                                <tr key={s.id} className="border-b border-border last:border-0 align-top">
                                    <td className="py-2.5 pr-3">
                                        <p className="text-text-main">{s.label}</p>
                                        <p className="text-xs text-text-secondary">Cubre ~{Math.round(s.coverage * 100)} % del riesgo</p>
                                    </td>
                                    <td className="py-2.5 pr-3 text-xs text-text-secondary">{s.covers.join(', ')}</td>
                                    <td className="py-2.5 pr-3">
                                        <p className="text-text-main font-medium tabular-nums">{s.monthlyUsd === null ? 'Por cotizar' : usd(s.monthlyUsd)}</p>
                                        <p className="text-[11px] text-text-secondary">{s.assumption}</p>
                                    </td>
                                    <td className="py-2.5 text-xs text-text-secondary">{s.sideEffect}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ul className="space-y-1 text-xs text-text-secondary list-disc pl-4">
                {notes.map((n) => (
                    <li key={n}>{n}</li>
                ))}
            </ul>
        </div>
    );
}