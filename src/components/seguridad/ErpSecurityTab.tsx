import { useState } from 'react';
import { Activity, Boxes, RefreshCw } from 'lucide-react';
import ErpSecurityPanel from './ErpSecurityPanel';
import ErpModulesPanel from './ErpModulesPanel';

type Sub = 'tecnica' | 'modulos';

const subTabs: { id: Sub; label: string; hint: string; icon: typeof Activity }[] = [
    { id: 'tecnica', label: 'Medición técnica', hint: 'Pruebas en vivo al ERP', icon: Activity },
    { id: 'modulos', label: 'Por módulo y costos', hint: 'Ranking, brechas y servicios AWS', icon: Boxes },
];

/** Pestaña «ERP EnterpriseCloud»: dos vistas que comparten el mismo botón de «Medir de nuevo». */
export default function ErpSecurityTab() {
    const [sub, setSub] = useState<Sub>('tecnica');
    const [refreshKey, setRefreshKey] = useState(0);
    const [spinning, setSpinning] = useState(false);

    const remeasure = () => {
        setRefreshKey((k) => k + 1);
        setSpinning(true);
        window.setTimeout(() => setSpinning(false), 900);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-3">
                <div role="tablist" aria-label="Vistas de seguridad del ERP" className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 max-w-2xl">
                    {subTabs.map((t) => {
                        const Icon = t.icon;
                        const active = sub === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setSub(t.id)}
                                className={`group flex items-center gap-3 text-left rounded-xl border px-3.5 py-2.5 transition-all duration-200 ${active
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border bg-card hover:border-primary/40 hover:-translate-y-0.5'
                                    }`}
                            >
                                <span
                                    className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 transition-colors ${active ? 'bg-primary text-white' : 'bg-border/50 text-text-secondary group-hover:text-primary'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className={`block text-sm font-semibold leading-tight ${active ? 'text-primary' : 'text-text-main'}`}>{t.label}</span>
                                    <span className="block text-[11px] text-text-secondary truncate">{t.hint}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={remeasure}
                    className="inline-flex items-center justify-center gap-2 self-start lg:self-center px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-text-main hover:border-primary/50 hover:text-primary active:scale-[0.98] transition-all"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} /> Medir de nuevo
                </button>
            </div>

            {/* key: al cambiar de pestaña el contenido entra con una pequeña animación */}
            <div key={sub} className="animate-page-in">
                {sub === 'tecnica' ? <ErpSecurityPanel refreshKey={refreshKey} /> : <ErpModulesPanel refreshKey={refreshKey} />}
            </div>
        </div>
    );
}