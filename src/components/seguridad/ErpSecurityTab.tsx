import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import ErpSecurityPanel from './ErpSecurityPanel';
import ErpModulesPanel from './ErpModulesPanel';

type Sub = 'tecnica' | 'modulos';

const subTabs: { id: Sub; label: string; hint: string }[] = [
    { id: 'tecnica', label: 'Medición técnica', hint: 'Pruebas en vivo al ERP' },
    { id: 'modulos', label: 'Por módulo y costos', hint: 'Ranking, brechas y servicios AWS' },
];

/** Pestaña «ERP EnterpriseCloud»: dos vistas que comparten el mismo botón de «Medir de nuevo». */
export default function ErpSecurityTab() {
    const [sub, setSub] = useState<Sub>('tecnica');
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div role="tablist" aria-label="Vistas de seguridad del ERP" className="flex gap-1 p-1 rounded-lg border border-border self-start">
                    {subTabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={sub === t.id}
                            title={t.hint}
                            onClick={() => setSub(t.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sub === t.id ? 'bg-[#2563EB] text-white' : 'text-text-secondary hover:text-text-main'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-main hover:bg-border/40"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Medir de nuevo
                </button>
            </div>

            {sub === 'tecnica' ? <ErpSecurityPanel refreshKey={refreshKey} /> : <ErpModulesPanel refreshKey={refreshKey} />}
        </div>
    );
}