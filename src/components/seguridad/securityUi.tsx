import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, X } from 'lucide-react';
import { barColor, ringHex, scoreColor, useGrow } from './securityHelpers';

/** Anillo de puntaje con el número al centro. */
export function ScoreRing({ value, size = 56 }: { value: number; size?: number }) {
    const shown = useGrow(value);
    const stroke = size >= 64 ? 6 : 5;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Puntaje ${value} de 100`} role="img">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    stroke={ringHex(value)}
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - shown / 100)}
                    style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)' }}
                />
            </svg>
            <span
                className={`absolute inset-0 grid place-items-center font-semibold tabular-nums ${scoreColor(value)} ${size >= 64 ? 'text-lg' : 'text-sm'}`}
            >
                {value}
            </span>
        </div>
    );
}

/** Barra doble: puntaje actual y puntaje con los servicios AWS recomendados. */
export function ScoreBar({ score, withAws }: { score: number; withAws: number }) {
    const now = useGrow(score);
    const aws = useGrow(withAws);
    const gain = withAws - score;
    return (
        <div>
            <div className="relative h-2 rounded-full bg-border overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#2563EB]/25"
                    style={{ width: `${aws}%`, transition: 'width 900ms cubic-bezier(.22,1,.36,1)' }}
                />
                <div
                    className={`absolute inset-y-0 left-0 rounded-full ${barColor(score)}`}
                    style={{ width: `${now}%`, transition: 'width 900ms cubic-bezier(.22,1,.36,1) 80ms' }}
                />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-text-secondary">
                <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${barColor(score)}`} />
                    Actual <span className={`font-semibold ${scoreColor(score)}`}>{score}</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]/40" />
                    con AWS <span className="font-semibold text-text-main">{withAws}</span>
                    {gain > 0 && (
                        <span className="inline-flex items-center gap-0.5 font-medium text-[#16A34A]">
                            <TrendingUp className="w-3 h-3" />+{gain}
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' | 'ok' | 'info' | 'bad' }) {
    const cls =
        tone === 'warn'
            ? 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706] border-amber-200 dark:border-amber-500/30'
            : tone === 'ok'
                ? 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30'
                : tone === 'info'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-[#2563EB] border-blue-200 dark:border-blue-500/30'
                    : tone === 'bad'
                        ? 'bg-red-50 dark:bg-red-500/10 text-[#DC2626] border-red-200 dark:border-red-500/30'
                        : 'bg-border/40 text-text-secondary border-border';
    return <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cls}`}>{children}</span>;
}

/** Título de sección dentro de una ventana: icono, texto y contador. */
export function SectionTitle({ icon, title, count }: { icon: ReactNode; title: string; count?: number }) {
    return (
        <h3 className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {icon}
            {title}
            {count !== undefined && (
                <span className="px-1.5 py-px rounded-md bg-border/60 text-[10px] font-semibold tabular-nums text-text-main">{count}</span>
            )}
            <span className="h-px flex-1 bg-border" />
        </h3>
    );
}

/** Mini tarjeta de dato (etiqueta pequeña + valor grande). */
export function StatTile({ label, value, hint, tone = 'neutral' }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'neutral' | 'warn' | 'ok' | 'info' }) {
    const accent =
        tone === 'warn' ? 'text-[#D97706]' : tone === 'ok' ? 'text-[#16A34A]' : tone === 'info' ? 'text-[#2563EB]' : 'text-text-main';
    return (
        <div className="rounded-xl border border-border bg-bg-main/40 px-3.5 py-3 min-w-0">
            <p className="text-[11px] text-text-secondary truncate">{label}</p>
            <p className={`mt-0.5 text-xl font-semibold tabular-nums leading-tight truncate ${accent}`}>{value}</p>
            {hint && <p className="text-[11px] text-text-secondary truncate">{hint}</p>}
        </div>
    );
}

/** Contenedor común de las ventanas: Escape, clic fuera, bloqueo de scroll y foco en el botón de cerrar. */
export function ModalShell({
    labelledBy,
    onClose,
    widthClass,
    children,
}: {
    labelledBy: string;
    onClose: () => void;
    widthClass: string;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[3px] animate-fade-in"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                className={`w-full ${widthClass} max-h-[90vh] flex flex-col overflow-hidden bg-card rounded-2xl border border-border shadow-2xl animate-pop-in`}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}

export function CloseX({ onClose }: { onClose: () => void }) {
    return (
        <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-border/40 hover:rotate-90 transition-all duration-200"
        >
            <X className="w-4 h-4" />
        </button>
    );
}