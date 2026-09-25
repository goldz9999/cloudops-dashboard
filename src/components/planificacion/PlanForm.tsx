import { Check } from 'lucide-react';
import type { RegionData } from '../../data/regionData';
import Select from '../common/Select';
import { services as serviceCatalog } from '../../data/mockData';

const toOptions = (items: string[]) => items.map((v) => ({ value: v, label: v }));


export interface PlanFormState {
  name: string;
  type: string;
  description: string;
  region: string;
  users: string;
  availability: string;
  migration: string;
  selected: string[];
}

interface Service {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  form: PlanFormState;
  regions: RegionData[];
  services: Service[];
  regionLabel: (r: RegionData) => string;
  onChange: (field: string, value: string) => void;
  onToggleService: (id: string) => void;
  onSave: () => void;
  saved: boolean;
}

export default function PlanForm({ form, regions, services, regionLabel, onChange, onToggleService, onSave, saved }: Props) {
  return (
    <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5 space-y-5">
      <h2 className="text-sm font-semibold text-text-main">Formulario de planificación</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Nombre de la solución</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Tipo de aplicación</label>
          <Select
            ariaLabel="Tipo de aplicación"
            value={form.type}
            onChange={(v) => onChange('type', v)}
            options={toOptions([
              'E-commerce / Tienda Online',
              'Sistema Empresarial (ERP/CRM)',
              'Aplicación Web SaaS',
              'Big Data y Analítica',
              'API y Backend Móvil',
            ])}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Región</label>
          <Select
            ariaLabel="Región"
            value={form.region}
            onChange={(v) => onChange('region', v)}
            options={regions.map((r) => ({ value: r.id, label: regionLabel(r) }))}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Usuarios estimados</label>
          <input
            type="number"
            value={form.users}
            onChange={(e) => onChange('users', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Disponibilidad requerida</label>
          <Select
            ariaLabel="Disponibilidad requerida"
            value={form.availability}
            onChange={(v) => onChange('availability', v)}
            options={toOptions(['Alta', 'Media', 'Estándar'])}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Objetivo de migración</label>
          <Select
            ariaLabel="Objetivo de migración"
            value={form.migration}
            onChange={(v) => onChange('migration', v)}
            options={toOptions([
              'Escalabilidad y Reducción de Costos',
              'Escalabilidad y Rendimiento Global',
              'Modernización y Agilidad',
              'Alta Disponibilidad y Resiliencia',
              'Cumplimiento y Seguridad',
            ])}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Servicios seleccionados</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            const selected = form.selected.includes(svc.id);
            const info = serviceCatalog.find((c) => c.id === svc.id);
            const tipId = `svc-tip-${svc.id}`;
            // Evita que el tooltip se salga de la pantalla en las columnas de los bordes
            const align = `${idx % 2 === 1 ? 'right-0' : 'left-0'} ${
              idx % 3 === 2 ? 'sm:right-0 sm:left-auto' : 'sm:left-0 sm:right-auto'
            }`;
            return (
              <div key={svc.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onToggleService(svc.id)}
                  aria-pressed={selected}
                  aria-describedby={info ? tipId : undefined}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    selected
                      ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-500/10 text-[#2563EB]'
                      : 'border-border text-text-secondary hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {svc.name}
                  {selected && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>

                {info && (
                  <div
                    id={tipId}
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full mb-2 z-30 w-64 max-w-[calc(100vw-3rem)] ${align} rounded-lg border border-border bg-card p-3 text-left shadow-lg shadow-black/10 dark:shadow-black/50 opacity-0 translate-y-1 transition duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-text-main">{info.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#2563EB]">
                        {info.category}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-text-secondary">{info.description}</p>
                    <p className="mt-1.5 text-[11px] text-text-main">
                      <span className="font-medium">Función principal:</span> {info.mainFunction}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-text-secondary">
          Pasa el cursor sobre un servicio para ver qué es. Haz clic para agregarlo o quitarlo.
        </p>
      </div>

      <button
        onClick={onSave}
        className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Guardar propuesta
      </button>

      {saved && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#16A34A]">Propuesta guardada</p>
            <p className="text-xs text-green-700 mt-0.5">La solución &quot;{form.name}&quot; ha sido registrada correctamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}