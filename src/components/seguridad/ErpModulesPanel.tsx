import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    Boxes,
    Check,
    CheckCircle2,
    ChevronDown,
    CircleHelp,
    Cloud,
    Coins,
    Fingerprint,
    Info,
    Layers,
    Receipt,
    ShieldAlert,
    Target,
    TrendingUp,
    TriangleAlert,
} from 'lucide-react';
import {
    fetchErpModules,
    type AwsServiceCost,
    type ErpModulesReport,
    type ModuleControl,
    type ModuleSecurity,
} from '../../api/erpSecurity';
import { SERVICE_INFO } from '../../data/erpServiceInfo';
import { barColor, iconTile, scoreColor, stateBadge, stateDot, stateLabel, tint, usd } from './securityHelpers';
import { Chip, CloseX, ModalShell, ScoreBar, ScoreRing, SectionTitle, StatTile } from './securityUi';

/** Lo que muestra el modal: un módulo o el eje IAM. */
interface DetailTarget {
    title: string;
    score: number;
    withAws: number;
    /** Porcentaje crítico del módulo (no aplica a IAM). */
    critical?: number;
    controls: ModuleControl[];
}

function OpenButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            aria-haspopup="dialog"
            onClick={onClick}
            className="group/btn inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg border border-border text-xs font-medium text-text-main hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors"
        >
            Ver brechas y soluciones
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
    );
}

function ModuleCard({ m, index, onOpen }: { m: ModuleSecurity; index: number; onOpen: (t: DetailTarget) => void }) {
    const gaps = m.controls.filter((c) => c.state === 'gap').length;
    return (
        <article
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 pl-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 animate-page-in"
            style={{ animationDelay: `${index * 55}ms` }}
        >
            <span className={`absolute inset-y-0 left-0 w-1 ${barColor(m.score)}`} aria-hidden="true" />
            <div className="flex items-start gap-3">
                <span className={`grid place-items-center h-7 min-w-7 px-1.5 rounded-md text-xs font-semibold tabular-nums ${tint(m.score)}`}>#{m.rank}</span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-text-main leading-snug">{m.label}</h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Chip>Porcentaje crítico {Math.round(m.criticality * 100)} %</Chip>
                        <Chip tone={gaps > 0 ? 'warn' : 'ok'}>
                            {gaps} brecha{gaps === 1 ? '' : 's'}
                        </Chip>
                    </div>
                </div>
                <ScoreRing value={m.score} />
            </div>
            <div className="mt-4">
                <ScoreBar score={m.score} withAws={m.scoreWithAws} />
            </div>
            <div className="mt-auto pt-4">
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
        </article>
    );
}

/* ───────────────────────── Ventana: brechas y soluciones ───────────────────────── */

const SERVICE_COLORS = ['#2563EB', '#7C3AED', '#0EA5E9', '#14B8A6', '#F59E0B', '#EC4899'];

function GapCard({ c, index, services }: { c: ModuleControl; index: number; services: AwsServiceCost[] }) {
    const info = c.service ? SERVICE_INFO[c.service] : undefined;
    const svc = services.find((s) => s.id === c.service);
    return (
        <li
            className="rounded-xl border border-border bg-card overflow-hidden animate-page-in"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-start gap-3 p-4">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-[#D97706] text-xs font-semibold tabular-nums shrink-0">
                    {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-main leading-snug">{info?.gap ?? c.label}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-full px-2.5 py-0.5">
                        <Cloud className="w-3.5 h-3.5" />
                        {info?.name ?? c.label}
                    </div>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Qué hará</p>
                    <p className="mt-0.5 text-sm text-text-main/90 leading-relaxed">{info?.does ?? c.detail}</p>
                </div>
            </div>
            {svc && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 border-t border-border bg-border/10 text-[11px] text-text-secondary">
                    <span className="flex items-center gap-2">
                        Cobertura
                        <span className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                            <span className="block h-full rounded-full bg-[#2563EB]" style={{ width: `${Math.round(svc.coverage * 100)}%` }} />
                        </span>
                        <span className="font-semibold text-text-main tabular-nums">~{Math.round(svc.coverage * 100)} %</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" />
                        {svc.monthlyUsd === null ? (
                            'Costo por cotizar'
                        ) : (
                            <>
                                <span className="font-semibold text-text-main tabular-nums">≈ {usd(svc.monthlyUsd)}</span> al mes (estimado)
                            </>
                        )}
                    </span>
                    {svc.covers.length > 1 && (
                        <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Un solo pago cubre {svc.covers.length} módulos
                        </span>
                    )}
                </div>
            )}
        </li>
    );
}

function DetailModal({ target, services, onClose }: { target: DetailTarget; services: AwsServiceCost[]; onClose: () => void }) {
    const gaps = target.controls.filter((c) => c.state === 'gap');
    const rest = target.controls.filter((c) => c.state !== 'gap');
    const improve = rest.filter((c) => c.value !== null && c.value < 1);
    const ok = rest.filter((c) => c.value === 1);
    const unmeasured = rest.filter((c) => c.value === null);
    const gain = target.withAws - target.score;

    return (
        <ModalShell labelledBy="erp-detail-title" onClose={onClose} widthClass="max-w-2xl">
            {/* Cabecera */}
            <div className="relative px-5 pt-5 pb-4 border-b border-border bg-linear-to-br from-primary/6 via-transparent to-transparent">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                        <ScoreRing value={target.score} size={64} />
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Brechas y soluciones</p>
                            <h2 id="erp-detail-title" className="text-lg font-semibold text-text-main leading-tight">
                                {target.title}
                            </h2>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <Chip>
                                    Actual <span className={`font-semibold ${scoreColor(target.score)}`}>{target.score}</span>
                                </Chip>
                                <Chip tone="info">
                                    Con AWS <span className="font-semibold">{target.withAws}</span>
                                    {gain > 0 && (
                                        <span className="inline-flex items-center gap-0.5 text-[#16A34A]">
                                            <TrendingUp className="w-3 h-3" />+{gain}
                                        </span>
                                    )}
                                </Chip>
                                {target.critical !== undefined && <Chip>Porcentaje crítico {target.critical} %</Chip>}
                            </div>
                        </div>
                    </div>
                    <CloseX onClose={onClose} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                    <StatTile label="Brechas" value={gaps.length} tone={gaps.length ? 'warn' : 'ok'} hint="Las cubriría AWS" />
                    <StatTile label="Por mejorar" value={improve.length} tone={improve.length ? 'warn' : 'ok'} hint="Cumple en parte" />
                    <StatTile label="Ya cumple" value={ok.length} tone="ok" hint={unmeasured.length ? `${unmeasured.length} sin medir` : 'Todo medido'} />
                </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                <section>
                    <SectionTitle icon={<ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />} title="Brechas y cómo las cubre AWS" count={gaps.length} />
                    {gaps.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-text-secondary">
                            <CheckCircle2 className="w-5 h-5 mx-auto mb-1.5 text-[#16A34A]" />
                            Este módulo no tiene brechas registradas.
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {gaps.map((c, i) => (
                                <GapCard key={c.id} c={c} index={i} services={services} />
                            ))}
                        </ul>
                    )}
                </section>

                {improve.length > 0 && (
                    <section>
                        <SectionTitle icon={<TriangleAlert className="w-3.5 h-3.5 text-[#F59E0B]" />} title="Por mejorar" count={improve.length} />
                        <ul className="space-y-2">
                            {improve.map((c) => {
                                const pct = Math.round((c.value ?? 0) * 100);
                                return (
                                    <li key={c.id} className="rounded-xl border border-border p-3.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-text-main">{c.label}</p>
                                                <p className="text-xs text-text-secondary mt-0.5">{c.detail}</p>
                                            </div>
                                            <span className="text-xs font-semibold tabular-nums text-[#D97706] shrink-0">{pct} %</span>
                                        </div>
                                        <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                                            <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${pct}%` }} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}

                {(ok.length > 0 || unmeasured.length > 0) && (
                    <section>
                        <SectionTitle icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />} title="Lo que ya cumple" count={ok.length} />
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ok.map((c) => (
                                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                                    <span className="flex items-center gap-2 text-sm text-text-main min-w-0">
                                        <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                                        <span className="truncate">{c.label}</span>
                                    </span>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${stateBadge[c.state]}`}>
                                        {stateLabel[c.state]}
                                    </span>
                                </li>
                            ))}
                            {unmeasured.map((c) => (
                                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2">
                                    <span className="flex items-center gap-2 text-sm text-text-secondary min-w-0">
                                        <CircleHelp className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{c.label}</span>
                                    </span>
                                    <span className="text-[10px] text-text-secondary shrink-0">Sin medir</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-border/10">
                <p className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                    <Info className="w-3.5 h-3.5 shrink-0" /> Cobertura y costos son estimaciones de referencia.
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-medium text-text-main hover:bg-border/40 transition-colors"
                >
                    Cerrar
                </button>
            </div>
        </ModalShell>
    );
}

/* ───────────────────────── Ventana: costos de la recomendación ───────────────────────── */

function CostsModal({
    services,
    notes,
    total,
    pending,
    onClose,
}: {
    services: AwsServiceCost[];
    notes: string[];
    total: number;
    pending: boolean;
    onClose: () => void;
}) {
    const [hover, setHover] = useState<string | null>(null);
    const [notesOpen, setNotesOpen] = useState(false);
    const colorOf = (i: number) => SERVICE_COLORS[i % SERVICE_COLORS.length];
    const priced = services.filter((s) => s.monthlyUsd !== null);
    const sumPriced = priced.reduce((acc, s) => acc + (s.monthlyUsd ?? 0), 0);
    const top = [...priced].sort((a, b) => (b.monthlyUsd ?? 0) - (a.monthlyUsd ?? 0))[0];
    const unpriced = services.length - priced.length;

    return (
        <ModalShell labelledBy="erp-costs-title" onClose={onClose} widthClass="max-w-5xl">
            {/* Cabecera */}
            <div className="px-5 pt-5 pb-4 border-b border-border bg-linear-to-br from-primary/6 via-transparent to-transparent">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className={`${iconTile} bg-primary/10 text-primary`}>
                            <Receipt className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Costos de la recomendación</p>
                            <h2 id="erp-costs-title" className="text-lg font-semibold text-text-main leading-tight">
                                Qué se compraría a AWS, cuánto cuesta y qué efecto tiene
                            </h2>
                        </div>
                    </div>
                    <CloseX onClose={onClose} />
                </div>

                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <StatTile label="Costo mensual estimado" value={usd(total)} tone="info" hint={pending ? 'Más MFA por cotizar' : 'Servicios únicos'} />
                    <StatTile label="Servicios" value={services.length} hint={unpriced ? `${unpriced} por cotizar` : 'Todos cotizados'} />
                    <StatTile label="Mayor costo" value={top ? usd(top.monthlyUsd ?? 0) : '—'} hint={top ? top.label : undefined} />
                    <StatTile
                        label="Costo por servicio"
                        value={priced.length ? usd(Math.round((sumPriced / priced.length) * 100) / 100) : '—'}
                        hint="Promedio de los cotizados"
                    />
                </div>

                {/* Reparto del costo */}
                {sumPriced > 0 && (
                    <div className="mt-4">
                        <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Reparto del costo mensual por servicio">
                            {services.map((s, i) =>
                                s.monthlyUsd ? (
                                    <div
                                        key={s.id}
                                        className="h-full rounded-sm transition-opacity duration-150"
                                        style={{
                                            width: `${(s.monthlyUsd / sumPriced) * 100}%`,
                                            background: colorOf(i),
                                            opacity: hover && hover !== s.id ? 0.3 : 1,
                                            minWidth: 4,
                                        }}
                                        onMouseEnter={() => setHover(s.id)}
                                        onMouseLeave={() => setHover(null)}
                                        title={`${s.label}: ${usd(s.monthlyUsd)}`}
                                    />
                                ) : null,
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Tabla */}
            <div className="flex-1 overflow-auto px-5 py-4">
                <table className="w-full min-w-[880px] text-sm border-separate border-spacing-0">
                    <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide text-text-secondary">
                            <th className="sticky top-0 bg-card z-10 pb-2 pr-3 font-semibold border-b border-border">Servicio</th>
                            <th className="sticky top-0 bg-card z-10 pb-2 pr-3 font-semibold border-b border-border">Cubre</th>
                            <th className="sticky top-0 bg-card z-10 pb-2 pr-3 font-semibold border-b border-border w-44">Costo / mes (estimado)</th>
                            <th className="sticky top-0 bg-card z-10 pb-2 font-semibold border-b border-border">Efecto colateral</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((s, i) => (
                            <tr
                                key={s.id}
                                className={`align-top animate-page-in transition-colors ${hover === s.id ? 'bg-primary/5' : 'hover:bg-border/20'}`}
                                style={{ animationDelay: `${i * 40}ms` }}
                                onMouseEnter={() => setHover(s.id)}
                                onMouseLeave={() => setHover(null)}
                            >
                                <td className="py-3.5 pr-3 border-b border-border w-64">
                                    <div className="flex items-start gap-2.5">
                                        <span className="mt-1.5 w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colorOf(i) }} />
                                        <div className="min-w-0">
                                            <p className="text-text-main font-medium leading-snug">{s.label}</p>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
                                                    <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${Math.round(s.coverage * 100)}%` }} />
                                                </div>
                                                <span className="text-[11px] text-text-secondary">Cubre ~{Math.round(s.coverage * 100)} % del riesgo</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3.5 pr-3 border-b border-border">
                                    <div className="flex flex-wrap gap-1">
                                        {s.covers.map((c) => (
                                            <Chip key={c}>{c}</Chip>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-3.5 pr-3 border-b border-border">
                                    <p className="text-text-main font-semibold tabular-nums text-base leading-tight">
                                        {s.monthlyUsd === null ? 'Por cotizar' : usd(s.monthlyUsd)}
                                    </p>
                                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">{s.assumption}</p>
                                </td>
                                <td className="py-3.5 border-b border-border">
                                    <p className="flex items-start gap-1.5 text-xs text-text-secondary leading-relaxed">
                                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#F59E0B]" />
                                        {s.sideEffect}
                                    </p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={2} className="pt-3.5 pr-3 text-xs text-text-secondary">
                                Total mensual estimado (servicios únicos){pending ? ' · falta cotizar MFA' : ''}
                            </td>
                            <td colSpan={2} className="pt-3.5 text-lg font-semibold text-text-main tabular-nums">
                                {usd(total)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Notas: plegadas para no alargar la ventana */}
            <div className="border-t border-border bg-border/10">
                <div className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <button
                        type="button"
                        onClick={() => setNotesOpen((o) => !o)}
                        aria-expanded={notesOpen}
                        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-main transition-colors"
                    >
                        <Info className="w-3.5 h-3.5" />
                        Notas y supuestos ({notes.length})
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${notesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-medium text-text-main hover:bg-border/40 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
                {notesOpen && (
                    <ul className="px-5 pb-3 space-y-1.5 text-xs text-text-secondary list-disc pl-9 max-h-36 overflow-y-auto animate-fade-in">
                        {notes.map((n) => (
                            <li key={n}>{n}</li>
                        ))}
                    </ul>
                )}
            </div>
        </ModalShell>
    );
}

function SummaryCard({
    icon,
    label,
    index,
    children,
}: {
    icon: ReactNode;
    label: string;
    index: number;
    children: ReactNode;
}) {
    return (
        <div
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 animate-page-in"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {icon}
            <div className="min-w-0">
                <p className="text-xs text-text-secondary">{label}</p>
                {children}
            </div>
        </div>
    );
}

export default function ErpModulesPanel({ refreshKey = 0 }: { refreshKey?: number }) {
    const [report, setReport] = useState<ErpModulesReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<DetailTarget | null>(null);
    const [costsOpen, setCostsOpen] = useState(false);
    const closeModal = useCallback(() => setSelected(null), []);
    const closeCosts = useCallback(() => setCostsOpen(false), []);

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
            <div className="bg-card rounded-xl border border-border p-5 space-y-3" aria-busy="true">
                <p className="text-sm text-text-secondary">Analizando módulos del ERP…</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-36 rounded-xl border border-border bg-border/30 animate-pulse" />
                    ))}
                </div>
            </div>
        ) : null;
    }

    const { summary, modules, services = [], notes = [], iam } = report;
    const iamGaps = iam ? iam.controls.filter((c) => c.state === 'gap').length : 0;
    const gain = summary.scoreWithAws - summary.score;

    return (
        <div className="bg-card rounded-xl border border-border p-5 space-y-6">
            {/* Encabezado */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <span className={`${iconTile} bg-primary/10 text-primary`}>
                        <Boxes className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold text-text-main">Seguridad por módulo del ERP</h2>
                        <p className="text-xs text-text-secondary mt-0.5 max-w-3xl">
                            Cada módulo se evalúa por separado: qué ya cubre el ERP, qué le falta y qué servicio de AWS lo cubriría, con su costo.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {(['measured', 'declared', 'gap'] as const).map((s) => (
                        <span
                            key={s}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${stateBadge[s]}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${stateDot[s]}`} />
                            {stateLabel[s]}
                            {s === 'measured' ? ' · comprobado en vivo' : s === 'declared' ? ' · según el código del ERP' : ' · lo que cubriría AWS'}
                        </span>
                    ))}
                </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <SummaryCard index={0} label="Seguridad actual del sistema" icon={<ScoreRing value={summary.score} size={52} />}>
                    <p className={`text-2xl font-semibold tabular-nums leading-tight ${scoreColor(summary.score)}`}>
                        {summary.score}
                        <span className="text-sm font-normal text-text-secondary"> / 100</span>
                    </p>
                </SummaryCard>
                <SummaryCard
                    index={1}
                    label="Con los servicios AWS recomendados"
                    icon={
                        <span className={`${iconTile} bg-primary/10 text-primary`}>
                            <TrendingUp className="w-5 h-5" />
                        </span>
                    }
                >
                    <p className="text-2xl font-semibold tabular-nums leading-tight text-text-main">
                        {summary.scoreWithAws}
                        <span className="text-sm font-normal text-text-secondary"> / 100</span>
                        {gain > 0 && <span className="ml-2 text-xs font-medium text-[#16A34A]">+{gain}</span>}
                    </p>
                    <p className="text-[11px] text-text-secondary">Ningún servicio da el 100 %</p>
                </SummaryCard>
                <SummaryCard
                    index={2}
                    label="Necesita más seguridad"
                    icon={
                        <span className={`${iconTile} ${tint(summary.mostNeeded.score)}`}>
                            <Target className="w-5 h-5" />
                        </span>
                    }
                >
                    <p className="text-base font-semibold text-text-main leading-tight">{summary.mostNeeded.label}</p>
                    <p className="text-[11px] text-text-secondary">Puntaje actual {summary.mostNeeded.score}</p>
                </SummaryCard>
                <SummaryCard
                    index={3}
                    label="Costo mensual estimado"
                    icon={
                        <span className={`${iconTile} bg-amber-50 dark:bg-amber-500/10 text-[#D97706]`}>
                            <Coins className="w-5 h-5" />
                        </span>
                    }
                >
                    <p className="text-2xl font-semibold tabular-nums leading-tight text-text-main">{usd(summary.planCostUsd)}</p>
                    <p className="text-[11px] text-text-secondary">
                        Servicios únicos{summary.planCostPending ? ' · falta cotizar MFA' : ''}
                    </p>
                </SummaryCard>
            </div>

            {/* Módulos */}
            <section>
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        Módulos, del que más necesita seguridad al que menos
                    </h3>
                    <span className="text-[11px] text-text-secondary tabular-nums">{modules.length} módulos</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                    {modules.map((m, i) => (
                        <ModuleCard key={m.id} m={m} index={i} onOpen={setSelected} />
                    ))}
                </div>
            </section>

            {/* Eje transversal: IAM */}
            {iam && (
                <section>
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Eje transversal</h3>
                        <span className="h-px flex-1 bg-border" />
                    </div>
                    <article
                        className="relative overflow-hidden rounded-xl border border-border bg-card p-4 pl-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto] lg:items-center transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 animate-page-in"
                    >
                        <span className={`absolute inset-y-0 left-0 w-1 ${barColor(iam.score)}`} aria-hidden="true" />
                        <div className="flex items-center gap-3 min-w-0">
                            <ScoreRing value={iam.score} />
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
                                    <Fingerprint className="w-4 h-4 text-[#2563EB] shrink-0" /> Identidad y acceso (IAM)
                                </h3>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    <Chip>Eje aparte</Chip>
                                    <Chip tone={iamGaps > 0 ? 'warn' : 'ok'}>
                                        {iamGaps} brecha{iamGaps === 1 ? '' : 's'}
                                    </Chip>
                                </div>
                            </div>
                        </div>
                        <ScoreBar score={iam.score} withAws={iam.scoreWithAws} />
                        <div className="lg:w-56">
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
                    </article>
                </section>
            )}

            {/* Costos: ahora detrás de un botón */}
            <section
                className="relative overflow-hidden rounded-xl border border-primary/25 bg-linear-to-r from-primary/8 via-primary/3 to-transparent p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`${iconTile} bg-primary/10 text-primary`}>
                        <Receipt className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-main">Recomendación de servicios AWS</p>
                        <p className="text-xs text-text-secondary">
                            {services.length} servicio{services.length === 1 ? '' : 's'} ·{' '}
                            <span className="font-semibold text-text-main tabular-nums">{usd(summary.planCostUsd)}</span> al mes
                            {summary.planCostPending ? ' + MFA por cotizar' : ''} · con su efecto colateral
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setCostsOpen(true)}
                    className="group/btn inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:brightness-110 active:scale-[0.98] transition-all self-start sm:self-auto"
                >
                    Ver costos de la recomendación
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
            </section>

            {selected && <DetailModal target={selected} services={services} onClose={closeModal} />}
            {costsOpen && (
                <CostsModal
                    services={services}
                    notes={notes}
                    total={summary.planCostUsd}
                    pending={summary.planCostPending}
                    onClose={closeCosts}
                />
            )}
        </div>
    );
}