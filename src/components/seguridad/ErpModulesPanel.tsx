import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Boxes, CheckCircle2, CircleHelp, Coins, Fingerprint, Target, X } from 'lucide-react';
import {
    fetchErpModules,
    type AwsServiceCost,
    type ControlState,
    type ErpModulesReport,
    type ModuleControl,
    type ModuleSecurity,
} from '../../api/erpSecurity';
import { SERVICE_INFO } from '../../data/erpServiceInfo';

const stateLabel: Record<ControlState, string> = { measured: 'Medido', declared: 'Declarado', gap: 'Brecha' };
const stateBadge: Record<ControlState, string> = {
    measured: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
    declared: 'bg-blue-50 dark:bg-blue-500/10 text-[#2563EB] border-blue-200 dark:border-blue-500/30',
    gap: 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706] border-amber-200 dark:border-amber-500/30',
};

const scoreColor = (n: number) => (n >= 90 ? 'text-[#16A34A]' : n >= 75 ? 'text-[#F59E0B]' : 'text-[#DC2626]');
const barColor = (n: number) => (n >= 90 ? 'bg-[#16A34A]' : n >= 75 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]');
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Lo que muestra el modal: un módulo o el eje IAM. */
interface DetailTarget {
    title: string;
    score: number;
    withAws: number;
    /** Porcentaje crítico del módulo (no aplica a IAM). */
    critical?: number;
    controls: ModuleControl[];
}

function ScoreBar({ score, withAws }: { score: number; withAws: number }) {
    return (
        <div>
            <div className="relative h-2 rounded-full bg-border overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-[#2563EB]/25" style={{ width: `${withAws}%` }} />
                <div className={`absolute inset-y-0 left-0 rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
                Actual <span className={`font-semibold ${scoreColor(score)}`}>{score}</span> · con AWS{' '}
                <span className="font-semibold text-text-main">{withAws}</span>
            </p>
        </div>
    );
}

function OpenButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            aria-haspopup="dialog"
            onClick={onClick}
            className="mt-3 text-xs font-medium text-primary hover:underline"
        >
            Ver brechas y soluciones →
        </button>
    );
}

function ModuleCard({ m, onOpen }: { m: ModuleSecurity; onOpen: (t: DetailTarget) => void }) {
    const gaps = m.controls.filter((c) => c.state === 'gap').length;
    return (
        <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                    <h3 className="text-sm font-medium text-text-main">
                        <span className="text-text-secondary tabular-nums">#{m.rank}</span> {m.label}
                    </h3>
                    <p className="text-xs text-text-secondary">
                        Porcentaje crítico {Math.round(m.criticality * 100)} % · {gaps} brecha{gaps === 1 ? '' : 's'}
                    </p>
                </div>
                <span className={`text-lg font-semibold tabular-nums ${scoreColor(m.score)}`}>{m.score}</span>
            </div>
            <ScoreBar score={m.score} withAws={m.scoreWithAws} />
            <OpenButton
                onClick={() =>
                    onOpen({
                        title: m.label,
                        score: m.score,
                        withAws: m.scoreWithAws,
                        critical: Math.round(m.criticality * 100),
                        controls: m.controls,
                    })
                }
            />
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-xs text-text-secondary pt-0.5">{label}</dt>
            <dd className="text-sm text-text-main min-w-0">{children}</dd>
        </div>
    );
}

function DetailModal({ target, services, onClose }: { target: DetailTarget; services: AwsServiceCost[]; onClose: () => void }) {
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    const gaps = target.controls.filter((c) => c.state === 'gap');
    const rest = target.controls.filter((c) => c.state !== 'gap');
    const improve = rest.filter((c) => c.value !== null && c.value < 1);
    const ok = rest.filter((c) => c.value === 1);
    const unmeasured = rest.filter((c) => c.value === null);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="erp-detail-title"
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card rounded-xl border border-border shadow-xl"
            >
                <div className="sticky top-0 bg-card flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border">
                    <div className="min-w-0">
                        <h2 id="erp-detail-title" className="text-base font-semibold text-text-main">
                            {target.title}
                        </h2>
                        <p className="text-xs text-text-secondary mt-1">
                            Actual <span className={`font-semibold ${scoreColor(target.score)}`}>{target.score}</span> · con AWS{' '}
                            <span className="font-semibold text-text-main">{target.withAws}</span>
                            {target.critical !== undefined && <> · Porcentaje crítico {target.critical} %</>}
                        </p>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-border/40"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-5">
                    <section>
                        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                            Brechas y cómo las cubre AWS ({gaps.length})
                        </h3>
                        {gaps.length === 0 ? (
                            <p className="text-sm text-text-secondary">Este módulo no tiene brechas registradas.</p>
                        ) : (
                            <ul className="space-y-3">
                                {gaps.map((c) => {
                                    const info = c.service ? SERVICE_INFO[c.service] : undefined;
                                    const svc = services.find((s) => s.id === c.service);
                                    return (
                                        <li key={c.id} className="rounded-lg border border-border p-4">
                                            <p className="text-sm font-medium text-text-main flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                                                {info?.gap ?? c.label}
                                            </p>
                                            <dl className="mt-2 space-y-1.5">
                                                <Row label="Servicio AWS">
                                                    <span className="font-medium">{info?.name ?? c.label}</span>
                                                </Row>
                                                <Row label="Qué hará">{info?.does ?? c.detail}</Row>
                                            </dl>
                                            {svc && (
                                                <p className="text-[11px] text-text-secondary mt-2">
                                                    Cubre ~{Math.round(svc.coverage * 100)} % del riesgo ·{' '}
                                                    {svc.monthlyUsd === null ? 'costo por cotizar' : `≈ ${usd(svc.monthlyUsd)}/mes (estimado)`}
                                                    {svc.covers.length > 1 ? ' · un solo pago para varios módulos' : ''}
                                                </p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {improve.length > 0 && (
                        <section>
                            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Por mejorar</h3>
                            <ul className="space-y-2">
                                {improve.map((c) => (
                                    <li key={c.id} className="flex items-start gap-2 text-sm">
                                        <AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-text-main">{c.label}</p>
                                            <p className="text-xs text-text-secondary">{c.detail}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {(ok.length > 0 || unmeasured.length > 0) && (
                        <section>
                            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Lo que ya cumple</h3>
                            <ul className="divide-y divide-border">
                                {ok.map((c) => (
                                    <li key={c.id} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                                        <span className="flex items-center gap-2 text-sm text-text-main min-w-0">
                                            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" /> {c.label}
                                        </span>
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${stateBadge[c.state]}`}>
                                            {stateLabel[c.state]}
                                        </span>
                                    </li>
                                ))}
                                {unmeasured.map((c) => (
                                    <li key={c.id} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                                        <span className="flex items-center gap-2 text-sm text-text-secondary min-w-0">
                                            <CircleHelp className="w-4 h-4 shrink-0" /> {c.label}
                                        </span>
                                        <span className="text-[11px] text-text-secondary shrink-0">Sin medir</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
                    <p className="text-[11px] text-text-secondary">Cobertura y costos son estimaciones de referencia.</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-main hover:bg-border/40"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default function ErpModulesPanel({ refreshKey = 0 }: { refreshKey?: number }) {
    const [report, setReport] = useState<ErpModulesReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<DetailTarget | null>(null);
    const closeModal = useCallback(() => setSelected(null), []);

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
    const iamGaps = iam ? iam.controls.filter((c) => c.state === 'gap').length : 0;

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
                        <ModuleCard key={m.id} m={m} onOpen={setSelected} />
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
                            <p className="text-xs text-text-secondary">
                                Eje aparte · {iamGaps} brecha{iamGaps === 1 ? '' : 's'}
                            </p>
                        </div>
                        <span className={`text-lg font-semibold tabular-nums ${scoreColor(iam.score)}`}>{iam.score}</span>
                    </div>
                    <ScoreBar score={iam.score} withAws={iam.scoreWithAws} />
                    <OpenButton
                        onClick={() =>
                            setSelected({
                                title: 'Identidad y acceso (IAM)',
                                score: iam.score,
                                withAws: iam.scoreWithAws,
                                controls: iam.controls,
                            })
                        }
                    />
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

            {selected && <DetailModal target={selected} services={services} onClose={closeModal} />}
        </div>
    );
}