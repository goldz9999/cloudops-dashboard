import { Check } from 'lucide-react';
import type { RegionData } from '../../data/regionData';


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
          <select
            value={form.type}
            onChange={(e) => onChange('type', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option>E-commerce / Tienda Online</option>
            <option>Sistema Empresarial (ERP/CRM)</option>
            <option>Aplicación Web SaaS</option>
            <option>Big Data y Analítica</option>
            <option>API y Backend Móvil</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Región</label>
          <select
            value={form.region}
            onChange={(e) => onChange('region', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 [color-scheme:light] dark:[color-scheme:dark]"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {regionLabel(r)}
              </option>
            ))}
          </select>
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
          <select
            value={form.availability}
            onChange={(e) => onChange('availability', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option>Alta</option>
            <option>Media</option>
            <option>Estándar</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Objetivo de migración</label>
          <select
            value={form.migration}
            onChange={(e) => onChange('migration', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-text-main focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="Escalabilidad y Reducción de Costos">Escalabilidad y Reducción de Costos</option>
            <option value="Escalabilidad y Rendimiento Global">Escalabilidad y Rendimiento Global</option>
            <option value="Modernización y Agilidad">Modernización y Agilidad</option>
            <option value="Alta Disponibilidad y Resiliencia">Alta Disponibilidad y Resiliencia</option>
            <option value="Cumplimiento y Seguridad">Cumplimiento y Seguridad</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Servicios seleccionados</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {services.map((svc) => {
            const Icon = svc.icon;
            const selected = form.selected.includes(svc.id);
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => onToggleService(svc.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  selected
                    ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-500/10 text-[#2563EB]'
                    : 'border-border text-text-secondary hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {svc.name}
                {selected && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </div>
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