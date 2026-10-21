import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle, CheckCircle2, ChevronRight, Cloud, FileArchive, FileCode2, FlaskConical, FolderUp, Info, Loader2,
    RefreshCw, ScanSearch, ShieldAlert, Trash2, UploadCloud, Wrench,
} from 'lucide-react';
import {
    analyzeProject, fetchAnalysisStatus,
    type AnalysisFinding, type AnalysisStatus, type FindingCategory, type FindingSeverity,
    type ProjectAnalysisReport, type RecommendedService, type UploadItem,
} from '../../api/projectAnalysis';
import { iconTile, useGrow } from './securityHelpers';
import { Chip, CloseX, ModalShell } from './securityUi';

/* ── Filtro de archivos en el navegador (evita subir node_modules, imágenes, etc.) ── */

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'out', 'venv', '.venv', 'env', '__pycache__', 'coverage',
    '.idea', '.vscode', 'target', 'vendor', '.turbo', '.cache', '.pytest_cache', '.mypy_cache', 'site-packages', '.svelte-kit',
]);
const IGNORED_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'poetry.lock', 'pipfile.lock', 'composer.lock', 'cargo.lock']);
const ALLOWED_EXT = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.java', '.kt', '.go', '.rb', '.php', '.cs', '.rs', '.sql', '.json',
    '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf', '.xml', '.gradle', '.tf', '.sh', '.html', '.md', '.txt', '.prisma',
    '.graphql', '.vue', '.svelte',
]);
const ALLOWED_NAMES = new Set(['dockerfile', 'procfile', 'makefile', '.gitignore', '.dockerignore', 'requirements.txt', '.python-version', '.nvmrc']);

const isZip = (path: string) => path.toLowerCase().endsWith('.zip');

function isRelevant(path: string): boolean {
    const parts = path.split('/');
    if (parts.slice(0, -1).some((d) => IGNORED_DIRS.has(d.toLowerCase()))) return false;
    const name = parts[parts.length - 1].toLowerCase();
    if (IGNORED_FILES.has(name)) return false;
    if (name.startsWith('.env') || ALLOWED_NAMES.has(name)) return true;
    const dot = name.lastIndexOf('.');
    return dot !== -1 && ALLOWED_EXT.has(name.slice(dot));
}

/* ── Lectura de carpetas arrastradas ── */

function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
    return new Promise((resolve, reject) => entry.file(resolve, reject));
}

async function readAllEntries(dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
    const reader = dir.createReader();
    const all: FileSystemEntry[] = [];
    for (; ;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
        if (batch.length === 0) return all;
        all.push(...batch);
    }
}

async function walkEntry(entry: FileSystemEntry, base: string, out: UploadItem[], stats: { ignored: number }): Promise<void> {
    const path = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory) {
        if (IGNORED_DIRS.has(entry.name.toLowerCase())) return; // no se recorre node_modules, .git…
        for (const child of await readAllEntries(entry as FileSystemDirectoryEntry)) await walkEntry(child, path, out, stats);
        return;
    }
    if (!isZip(path) && !isRelevant(path)) {
        stats.ignored += 1;
        return;
    }
    out.push({ file: await fileFromEntry(entry as FileSystemFileEntry), path });
}

/* ── Presentación ── */

const sevLabel: Record<FindingSeverity, string> = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' };
const sevTone: Record<FindingSeverity, 'bad' | 'warn' | 'info'> = { critical: 'bad', high: 'bad', medium: 'warn', low: 'info' };
const sevStripe: Record<FindingSeverity, string> = { critical: 'bg-[#DC2626]', high: 'bg-[#DC2626]', medium: 'bg-[#F59E0B]', low: 'bg-[#2563EB]' };
const catLabel: Record<FindingCategory, string> = { security: 'Seguridad', scalability: 'Escalabilidad' };

const when = (iso: string) => new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
const kb = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type ResultTab = 'fallas' | 'servicios' | 'pruebas' | 'buenas';
type ModalTarget = { kind: 'finding'; id: string } | { kind: 'service'; name: string } | { kind: 'warnings' };

const riskText = (n: number, limit: number) => (n >= limit ? 'text-[#DC2626]' : n >= limit * 0.55 ? 'text-[#D97706]' : 'text-[#16A34A]');
const riskBar = (n: number, limit: number) => (n >= limit ? 'bg-[#DC2626]' : n >= limit * 0.55 ? 'bg-[#F59E0B]' : 'bg-[#16A34A]');

/** Porcentaje de riesgo: parte de 2 %, sube con los hallazgos y marca el umbral (70 %) a partir del cual hay que hacer pruebas. */
function RiskCard({ label, risk, sub, limit }: { label: string; risk: number; sub: string; limit: number }) {
    const shown = useGrow(risk);
    const over = risk >= limit;
    return (
        <div className={`rounded-xl border px-4 py-3 ${over ? 'border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5' : 'border-border bg-bg-main/40'}`}>
            <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-medium text-text-secondary">{label}</p>
                <span className="text-[11px] text-text-secondary truncate">{sub}</span>
            </div>
            <p className={`mt-0.5 text-3xl font-semibold tabular-nums leading-tight ${riskText(risk, limit)}`}>
                {risk}<span className="text-sm font-normal text-text-secondary"> %</span>
            </p>
            <div className="relative mt-2 h-2 rounded-full bg-border" role="img" aria-label={`Riesgo ${risk} %, umbral de pruebas ${limit} %`}>
                <div
                    className={`h-full rounded-full ${riskBar(risk, limit)}`}
                    style={{ width: `${shown}%`, transition: 'width 900ms cubic-bezier(.22,1,.36,1)' }}
                />
                <span className="absolute -top-1 -bottom-1 w-0.5 rounded bg-text-main/50" style={{ left: `${limit}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className={over ? 'font-medium text-[#DC2626]' : 'text-text-secondary'}>{over ? 'Requiere pruebas' : 'Bajo el umbral de pruebas'}</span>
                <span className="text-text-secondary tabular-nums">{limit} %</span>
            </div>
        </div>
    );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
    return (
        <div role="group" aria-label={label} className="flex gap-0.5 p-0.5 rounded-lg border border-border">
            {options.map((o) => (
                <button
                    key={o.id}
                    type="button"
                    onClick={() => onChange(o.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${value === o.id ? 'bg-[#2563EB] text-white' : 'text-text-secondary hover:text-text-main'}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function FindingRow({ f, onOpen }: { f: AnalysisFinding; onOpen: () => void }) {
    return (
        <button
            type="button"
            aria-haspopup="dialog"
            onClick={onOpen}
            className="group relative w-full flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-bg-main/40 pl-4 pr-3 py-2.5 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
            <span className={`absolute inset-y-0 left-0 w-1 ${sevStripe[f.severity]}`} />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-main truncate">{f.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Chip tone={sevTone[f.severity]}>{sevLabel[f.severity]}</Chip>
                    <Chip>{catLabel[f.category]}</Chip>
                    {f.files.length > 0 && <span className="text-[11px] text-text-secondary">{plural(f.files.length, 'archivo', 'archivos')}</span>}
                </div>
            </div>
            <span className="hidden sm:flex items-center gap-1 shrink-0 text-[11px] text-text-secondary">
                <Cloud className="w-3.5 h-3.5" />
                {f.awsServices.length > 0 ? plural(f.awsServices.length, 'servicio', 'servicios') : 'Solo código'}
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </button>
    );
}

function ServiceCard({ s, onOpen }: { s: RecommendedService; onOpen: () => void }) {
    return (
        <button
            type="button"
            aria-haspopup="dialog"
            onClick={onOpen}
            className="group flex flex-col text-left rounded-xl border border-border bg-bg-main/40 p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                    <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0"><Cloud className="w-4 h-4" /></span>
                    <span className="text-sm font-semibold text-text-main truncate">{s.service}</span>
                </span>
                <Chip tone={sevTone[s.maxSeverity]}>{sevLabel[s.maxSeverity]}</Chip>
            </div>
            <p className="mt-2 text-xs text-text-secondary line-clamp-2 min-h-8">{s.reasons[0] ?? 'Mitiga los hallazgos relacionados.'}</p>
            <span className="mt-2 flex items-center justify-between text-[11px] text-text-secondary">
                Cubre {plural(s.findingIds.length, 'hallazgo', 'hallazgos')}
                <span className="inline-flex items-center gap-0.5 font-medium text-primary">Ver detalle <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></span>
            </span>
        </button>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-text-secondary">{children}</p>;
}

/* ── Ventanas de detalle ── */

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
            {children}
        </section>
    );
}

function FindingModal({ f, onClose }: { f: AnalysisFinding; onClose: () => void }) {
    return (
        <ModalShell labelledBy="analysis-finding-title" onClose={onClose} widthClass="max-w-2xl">
            <div className="relative px-5 pt-5 pb-4 border-b border-border">
                <span className={`absolute inset-x-0 top-0 h-1 ${sevStripe[f.severity]}`} />
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <Chip tone={sevTone[f.severity]}>{sevLabel[f.severity]}</Chip>
                            <Chip>{catLabel[f.category]}</Chip>
                            <span className="text-[11px] text-text-secondary">{f.id}</span>
                        </div>
                        <h2 id="analysis-finding-title" className="text-lg font-semibold text-text-main leading-tight">{f.title}</h2>
                    </div>
                    <CloseX onClose={onClose} />
                </div>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
                {f.description && <ModalSection title="Qué pasa"><p className="text-sm text-text-main">{f.description}</p></ModalSection>}
                {f.files.length > 0 && (
                    <ModalSection title="Dónde">
                        <div className="flex flex-wrap gap-1.5">
                            {f.files.map((p) => <code key={p} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-border/50 text-text-main break-all">{p}</code>)}
                        </div>
                    </ModalSection>
                )}
                {f.evidence && (
                    <ModalSection title="Evidencia">
                        <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-bg-main/60 p-3 font-mono text-[11px] text-text-main">{f.evidence}</pre>
                    </ModalSection>
                )}
                {f.fix && (
                    <ModalSection title="Cómo corregirlo">
                        <p className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-text-main">
                            <Wrench className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> {f.fix}
                        </p>
                    </ModalSection>
                )}
                <ModalSection title="Servicios AWS que lo cubren">
                    {f.awsServices.length === 0 ? (
                        <p className="text-sm text-text-secondary">Se corrige en el código: ningún servicio de AWS lo resuelve por sí solo.</p>
                    ) : (
                        <ul className="space-y-2">
                            {f.awsServices.map((s) => (
                                <li key={s.service} className="flex items-start gap-2.5 rounded-lg border border-border p-3">
                                    <Cloud className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-text-main">{s.service}</p>
                                        {s.reason && <p className="text-xs text-text-secondary mt-0.5">{s.reason}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </ModalSection>
            </div>
        </ModalShell>
    );
}

function ServiceModal({ s, findings, onClose, onOpenFinding }: { s: RecommendedService; findings: AnalysisFinding[]; onClose: () => void; onOpenFinding: (id: string) => void }) {
    return (
        <ModalShell labelledBy="analysis-service-title" onClose={onClose} widthClass="max-w-xl">
            <div className="px-5 pt-5 pb-4 border-b border-border">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className={`${iconTile} bg-primary/10 text-primary`}><Cloud className="w-5 h-5" /></span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Servicio AWS recomendado</p>
                            <h2 id="analysis-service-title" className="text-lg font-semibold text-text-main leading-tight truncate">{s.service}</h2>
                        </div>
                    </div>
                    <CloseX onClose={onClose} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                    <Chip tone={sevTone[s.maxSeverity]}>Prioridad {sevLabel[s.maxSeverity].toLowerCase()}</Chip>
                    <Chip>Cubre {plural(s.findingIds.length, 'hallazgo', 'hallazgos')}</Chip>
                </div>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
                {s.reasons.length > 0 && (
                    <ModalSection title="Qué aporta en este proyecto">
                        <ul className="space-y-1.5">
                            {s.reasons.map((r) => <li key={r} className="text-sm text-text-main">• {r}</li>)}
                        </ul>
                    </ModalSection>
                )}
                <ModalSection title="Hallazgos que cubre">
                    <ul className="space-y-1.5">
                        {findings.map((f) => (
                            <li key={f.id}>
                                <button
                                    type="button"
                                    onClick={() => onOpenFinding(f.id)}
                                    className="group w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                >
                                    <Chip tone={sevTone[f.severity]}>{sevLabel[f.severity]}</Chip>
                                    <span className="flex-1 min-w-0 text-sm text-text-main truncate">{f.title}</span>
                                    <ChevronRight className="w-4 h-4 shrink-0 text-text-secondary group-hover:text-primary transition-colors" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </ModalSection>
            </div>
        </ModalShell>
    );
}

function WarningsModal({ report, onClose }: { report: ProjectAnalysisReport; onClose: () => void }) {
    const reasons = Object.entries(report.files.skippedByReason);
    return (
        <ModalShell labelledBy="analysis-warnings-title" onClose={onClose} widthClass="max-w-xl">
            <div className="px-5 pt-5 pb-4 border-b border-border flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Sobre este análisis</p>
                    <h2 id="analysis-warnings-title" className="text-lg font-semibold text-text-main leading-tight">Avisos y alcance</h2>
                </div>
                <CloseX onClose={onClose} />
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
                {report.warnings.length > 0 && (
                    <ModalSection title="Avisos">
                        <ul className="space-y-2">
                            {report.warnings.map((w) => (
                                <li key={w} className="flex items-start gap-2 text-sm text-[#D97706]">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {w}
                                </li>
                            ))}
                        </ul>
                    </ModalSection>
                )}
                <ModalSection title="Archivos">
                    <p className="text-sm text-text-main">
                        Se analizaron {report.files.analyzed} archivos ({report.files.totalKb} KB) y se omitieron {report.files.skipped}.
                    </p>
                    {reasons.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                            {reasons.map(([r, n]) => <li key={r} className="text-xs text-text-secondary">• {n} × {r}</li>)}
                        </ul>
                    )}
                </ModalSection>
                <ModalSection title="Cómo se calcula">
                    <p className="text-sm text-text-secondary">
                        Estimación hecha por IA ({report.model}) leyendo el código del proyecto sin ejecutarlo. El riesgo parte de 2 % y sube según la
                        severidad de cada hallazgo; nunca llega a 0 % ni a 100 %. Con {report.overall.testsThreshold} % o más hay que hacer pruebas.
                        No reemplaza una auditoría ni pruebas de penetración.
                    </p>
                </ModalSection>
            </div>
        </ModalShell>
    );
}

/* ── Resultado ── */

function ResultView({ report }: { report: ProjectAnalysisReport }) {
    const [tab, setTab] = useState<ResultTab>('fallas');
    const [catFilter, setCatFilter] = useState<FindingCategory | 'all'>('all');
    const [sevFilter, setSevFilter] = useState<FindingSeverity | 'all'>('all');
    const [modal, setModal] = useState<ModalTarget | null>(null);
    const closeModal = useCallback(() => setModal(null), []);

    const byId = useMemo(() => new Map(report.findings.map((f) => [f.id, f])), [report.findings]);
    const findings = report.findings.filter((f) => (catFilter === 'all' || f.category === catFilter) && (sevFilter === 'all' || f.severity === sevFilter));

    const tabs: { id: ResultTab; label: string; count: number; icon: typeof AlertTriangle }[] = [
        { id: 'fallas', label: 'Fallas', count: report.findings.length, icon: AlertTriangle },
        { id: 'servicios', label: 'Servicios AWS', count: report.recommendedServices.length, icon: Cloud },
        { id: 'pruebas', label: 'Pruebas', count: report.suggestedTests.length, icon: FlaskConical },
        { id: 'buenas', label: 'Buenas prácticas', count: report.positives.length, icon: CheckCircle2 },
    ];

    const modalService = modal?.kind === 'service' ? report.recommendedServices.find((s) => s.service === modal.name) : undefined;
    const modalFinding = modal?.kind === 'finding' ? byId.get(modal.id) : undefined;

    return (
        <div className="space-y-4 animate-page-in">
            {/* Resumen */}
            <div className="rounded-xl border border-border bg-bg-main/40 px-4 py-3">
                {report.summary && <p className="text-sm text-text-main line-clamp-2">{report.summary}</p>}
                {report.stack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {report.stack.slice(0, 8).map((t) => <Chip key={t}>{t}</Chip>)}
                        {report.stack.length > 8 && <Chip>+{report.stack.length - 8}</Chip>}
                    </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary">
                    <span>{when(report.analyzedAt)}</span>
                    <span>· {report.files.analyzed} archivos analizados</span>
                    <span>· {report.model}</span>
                    <button
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => setModal({ kind: 'warnings' })}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                        <Info className="w-3.5 h-3.5" />
                        {report.warnings.length > 0 ? `${plural(report.warnings.length, 'aviso', 'avisos')} y alcance` : 'Alcance del análisis'}
                    </button>
                </div>
            </div>

            {/* Porcentajes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <RiskCard label="Riesgo de seguridad" risk={report.security.risk} limit={report.overall.testsThreshold} sub={plural(report.security.findings, 'hallazgo', 'hallazgos')} />
                <RiskCard label="Riesgo de escalabilidad" risk={report.scalability.risk} limit={report.overall.testsThreshold} sub={plural(report.scalability.findings, 'hallazgo', 'hallazgos')} />
                <RiskCard label="Riesgo global" risk={report.overall.risk} limit={report.overall.testsThreshold} sub={`${report.files.analyzed} archivos`} />
            </div>

            {/* Aviso de pruebas */}
            {report.overall.testsRequired && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-[#DC2626]">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        {report.overall.testsReasons.join(' · ')} (umbral {report.overall.testsThreshold} %): hay que hacer pruebas.
                    </p>
                    <button
                        type="button"
                        onClick={() => setTab('pruebas')}
                        className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-500/40 text-xs font-semibold text-[#DC2626] hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                        Ver pruebas
                    </button>
                </div>
            )}

            {/* Pestañas */}
            <div role="tablist" aria-label="Resultados del análisis" className="flex flex-wrap gap-1 border-b border-border">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTab(t.id)}
                            className={`-mb-px inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${active ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main'}`}
                        >
                            <Icon className="w-3.5 h-3.5" /> {t.label}
                            <span className="px-1.5 py-px rounded-md bg-border/60 text-[10px] tabular-nums text-text-main">{t.count}</span>
                        </button>
                    );
                })}
            </div>

            <div key={tab} className="animate-page-in">
                {tab === 'fallas' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <Segmented
                                label="Categoría"
                                value={catFilter}
                                onChange={setCatFilter}
                                options={[{ id: 'all', label: 'Todas' }, { id: 'security', label: 'Seguridad' }, { id: 'scalability', label: 'Escalabilidad' }]}
                            />
                            <Segmented
                                label="Severidad"
                                value={sevFilter}
                                onChange={setSevFilter}
                                options={[{ id: 'all', label: 'Toda severidad' }, { id: 'critical', label: 'Crítica' }, { id: 'high', label: 'Alta' }, { id: 'medium', label: 'Media' }, { id: 'low', label: 'Baja' }]}
                            />
                        </div>
                        {findings.length === 0 ? (
                            <Empty>No hay hallazgos con ese filtro.</Empty>
                        ) : (
                            <div className="space-y-2">
                                {findings.map((f) => <FindingRow key={f.id} f={f} onOpen={() => setModal({ kind: 'finding', id: f.id })} />)}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'servicios' && (
                    report.recommendedServices.length === 0 ? (
                        <Empty>Los hallazgos de este proyecto se corrigen en el código; no hay servicios AWS que recomendar.</Empty>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {report.recommendedServices.map((s) => <ServiceCard key={s.service} s={s} onOpen={() => setModal({ kind: 'service', name: s.service })} />)}
                        </div>
                    )
                )}

                {tab === 'pruebas' && (
                    report.suggestedTests.length === 0 ? (
                        <Empty>No hay pruebas sugeridas para este proyecto.</Empty>
                    ) : (
                        <div className="space-y-3">
                            <p className={`text-xs ${report.overall.testsRequired ? 'font-medium text-[#DC2626]' : 'text-text-secondary'}`}>
                                {report.overall.testsRequired
                                    ? `Pruebas obligatorias: el riesgo llegó al umbral de ${report.overall.testsThreshold} %.`
                                    : `Pruebas recomendadas: el riesgo está por debajo del umbral de ${report.overall.testsThreshold} %.`}
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {report.suggestedTests.map((t) => (
                                    <li key={t.type} className="flex items-start gap-3 rounded-xl border border-border bg-bg-main/40 p-3.5">
                                        <span className="grid place-items-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0"><FlaskConical className="w-4 h-4" /></span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-text-main">{t.type}</p>
                                            {t.why && <p className="text-xs text-text-secondary mt-0.5">{t.why}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                )}

                {tab === 'buenas' && (
                    report.positives.length === 0 ? (
                        <Empty>La IA no destacó buenas prácticas en este proyecto.</Empty>
                    ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {report.positives.map((p) => (
                                <li key={p} className="flex items-start gap-2 rounded-xl border border-border bg-bg-main/40 px-3.5 py-2.5 text-sm text-text-main">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#16A34A]" /> {p}
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </div>

            {modalFinding && <FindingModal f={modalFinding} onClose={closeModal} />}
            {modalService && (
                <ServiceModal
                    s={modalService}
                    findings={modalService.findingIds.map((id) => byId.get(id)).filter((f): f is AnalysisFinding => !!f)}
                    onClose={closeModal}
                    onOpenFinding={(id) => setModal({ kind: 'finding', id })}
                />
            )}
            {modal?.kind === 'warnings' && <WarningsModal report={report} onClose={closeModal} />}
        </div>
    );
}

/** Pestaña «Análisis de proyecto»: sube los archivos de un proyecto y Gemini detecta brechas y servicios AWS recomendados. */
export default function ProjectAnalysisTab() {
    const [status, setStatus] = useState<AnalysisStatus | null>(null);
    const [items, setItems] = useState<UploadItem[]>([]);
    const [ignored, setIgnored] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<ProjectAnalysisReport | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const zipInput = useRef<HTMLInputElement>(null);
    const filesInput = useRef<HTMLInputElement>(null);
    const folderInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAnalysisStatus().then(setStatus).catch(() => setStatus(null));
        return () => abortRef.current?.abort();
    }, []);

    const maxFileBytes = (status?.maxFileKb ?? 200) * 1024;
    const maxZipBytes = (status?.maxZipMb ?? 50) * 1024 * 1024;

    /** Mezcla archivos nuevos (sin repetir rutas) aplicando el mismo filtro que el backend. */
    const addItems = useCallback(
        (incoming: UploadItem[], alreadyIgnored = 0) => {
            let skipped = alreadyIgnored;
            const accepted: UploadItem[] = [];
            for (const it of incoming) {
                const ok = isZip(it.path) ? it.file.size <= maxZipBytes : isRelevant(it.path) && it.file.size <= maxFileBytes;
                if (ok) accepted.push(it);
                else skipped += 1;
            }
            setItems((prev) => {
                const map = new Map(prev.map((p) => [p.path, p]));
                accepted.forEach((a) => map.set(a.path, a));
                return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
            });
            setIgnored((n) => n + skipped);
            setReport(null);
            setError(null);
        },
        [maxFileBytes, maxZipBytes],
    );

    const onPicked = (list: FileList | null) => {
        if (!list) return;
        addItems(Array.from(list).map((file) => ({ file, path: file.webkitRelativePath || file.name })));
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const entries = Array.from(e.dataTransfer.items)
            .map((i) => i.webkitGetAsEntry?.())
            .filter((x): x is FileSystemEntry => !!x);
        if (entries.length === 0) {
            onPicked(e.dataTransfer.files);
            return;
        }
        const out: UploadItem[] = [];
        const stats = { ignored: 0 };
        try {
            for (const entry of entries) await walkEntry(entry, '', out, stats);
            addItems(out, stats.ignored);
        } catch {
            setError('No se pudieron leer los archivos arrastrados. Usa los botones «Seleccionar».');
        }
    };

    const clearAll = () => {
        setItems([]);
        setIgnored(0);
        setReport(null);
        setError(null);
    };

    const run = async () => {
        if (items.length === 0 || loading) return;
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        setError(null);
        setReport(null);
        try {
            setReport(await analyzeProject(items, ctrl.signal));
        } catch (e) {
            if ((e as Error).name !== 'AbortError') setError(e instanceof Error ? e.message : 'No se pudo analizar el proyecto.');
        } finally {
            setLoading(false);
        }
    };

    const totalBytes = items.reduce((n, i) => n + i.file.size, 0);
    const hasResult = !!report && !loading;

    return (
        <div className="bg-card rounded-xl border border-border p-5 space-y-5">
            <div className="flex items-start gap-3">
                <span className={`${iconTile} bg-primary/10 text-primary`}>
                    <ScanSearch className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-text-main flex flex-wrap items-center gap-2">
                        Análisis de proyecto con IA
                        <Chip tone="info">Gemini</Chip>
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5 max-w-3xl">
                        Sube el .zip de un proyecto: la IA detecta fallas de seguridad y escalabilidad y te dice qué servicios de AWS las cubrirían.
                        Es una revisión estática del código (no ejecuta nada).
                    </p>
                </div>
            </div>

            {status && !status.configured && (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary">
                    Falta configurar Gemini: agrega <code className="font-mono text-xs px-1 py-0.5 rounded bg-border/50">GEMINI_API_KEY=tu_clave</code> al{' '}
                    <code className="font-mono text-xs px-1 py-0.5 rounded bg-border/50">.env</code> de Backencito y reinícialo. La clave gratuita se crea en{' '}
                    <span className="font-medium text-text-main">aistudio.google.com/apikey</span>.
                </div>
            )}

            {hasResult ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg-main/40 px-4 py-2.5">
                    <p className="flex items-center gap-2 min-w-0 text-sm text-text-main">
                        <FileArchive className="w-4 h-4 shrink-0 text-primary" />
                        <span className="truncate font-medium">{items.length === 1 ? items[0].path : `${items.length} elementos`}</span>
                        <span className="shrink-0 text-xs text-text-secondary">{kb(totalBytes)}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={clearAll}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:text-text-main transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Nuevo proyecto
                        </button>
                        <button
                            type="button"
                            onClick={run}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-main hover:border-primary/50 hover:text-primary transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Analizar de nuevo
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Zona de subida */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-border bg-bg-main/40'}`}
                    >
                        <UploadCloud className="w-8 h-8 mx-auto text-primary" />
                        <p className="mt-2 text-sm font-medium text-text-main">Arrastra aquí el .zip del proyecto</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                            Máx. {status?.maxZipMb ?? 50} MB. Se omiten solos node_modules, .git, imágenes y lockfiles. Los valores de tu .env no se envían a Gemini.
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => zipInput.current?.click()}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                <FileArchive className="w-3.5 h-3.5" /> Seleccionar .zip
                            </button>
                            <button
                                type="button"
                                onClick={() => filesInput.current?.click()}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-text-main hover:border-primary/50 hover:text-primary active:scale-[0.98] transition-all"
                            >
                                <FileCode2 className="w-3.5 h-3.5" /> Seleccionar archivos
                            </button>
                            <button
                                type="button"
                                onClick={() => folderInput.current?.click()}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-text-main hover:border-primary/50 hover:text-primary active:scale-[0.98] transition-all"
                            >
                                <FolderUp className="w-3.5 h-3.5" /> Seleccionar carpeta
                            </button>
                        </div>
                        <input ref={zipInput} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => { onPicked(e.target.files); e.target.value = ''; }} />
                        <input ref={filesInput} type="file" multiple className="hidden" onChange={(e) => { onPicked(e.target.files); e.target.value = ''; }} />
                        <input
                            ref={folderInput}
                            type="file"
                            multiple
                            className="hidden"
                            {...({ webkitdirectory: '' } as Record<string, string>)}
                            onChange={(e) => { onPicked(e.target.files); e.target.value = ''; }}
                        />
                    </div>

                    {items.length > 0 && (
                        <div className="rounded-xl border border-border bg-bg-main/40 p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm text-text-main">
                                    <span className="font-semibold tabular-nums">{items.length}</span> {items.length === 1 ? 'elemento listo' : 'elementos listos'} · {kb(totalBytes)}
                                    {ignored > 0 && <span className="text-xs text-text-secondary"> · {ignored} omitidos (no relevantes o muy grandes)</span>}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        disabled={loading}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:text-text-main disabled:opacity-50 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Quitar todo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={run}
                                        disabled={loading || status?.configured === false}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanSearch className="w-3.5 h-3.5" />}
                                        {loading ? 'Analizando…' : 'Analizar proyecto'}
                                    </button>
                                </div>
                            </div>
                            <ul className="max-h-40 overflow-y-auto divide-y divide-border rounded-lg border border-border bg-card">
                                {items.map((i) => (
                                    <li key={i.path} className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
                                        <code className="font-mono text-text-main truncate">{i.path}</code>
                                        <span className="text-text-secondary tabular-nums shrink-0">{kb(i.file.size)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-[#DC2626]">
                    No se pudo analizar: {error}
                </div>
            )}

            {loading && (
                <div className="space-y-3" aria-busy="true">
                    <p className="text-sm text-text-secondary">Gemini está revisando el proyecto… puede tardar entre 30 y 90 segundos.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-28 rounded-xl border border-border bg-border/30 animate-pulse" />
                        ))}
                    </div>
                </div>
            )}

            {report && !loading && <ResultView key={report.analyzedAt} report={report} />}
        </div>
    );
}