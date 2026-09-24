import { useState } from 'react';
import {
  Server,
  HardDrive,
  Database,
  Shield,
  Network,
  Globe2,
  Cloud,
  Search,
  X,
} from 'lucide-react';
import { services, serviceCategories } from '../data/mockData';
import { useRegion } from '../context/useRegion';
import { regionLabel } from '../data/regionData';
import { filterServices, matchesSearch } from '../utils/filterServices';

const iconMap: Record<string, React.ElementType> = {
  Server,
  HardDrive,
  Database,
  Shield,
  Network,
  Globe: Globe2,
  Cloud,
};

export default function Servicios() {
  const { region } = useRegion();
  const metrics = region.serviceMetrics;
  const isUp = (id: string) => metrics[id]?.status === 'in-use';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Todos');

  const filtered = filterServices(services, search, category);
  const filtersActive = search.trim() !== '' || category !== 'Todos';

  // Cantidad de resultados por categoría según la búsqueda actual
  const countFor = (cat: string) =>
    services.filter((s) => matchesSearch(s, search) && (cat === 'Todos' || s.category === cat)).length;

  const clearFilters = () => {
    setSearch('');
    setCategory('Todos');
  };

  const inUse = services.filter((s) => isUp(s.id)).length;
  const available = services.length - inUse;
  const cats = new Set(services.map((s) => s.category)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1E293B]">Servicios AWS</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Catálogo de servicios AWS en{' '}
          <span className="font-medium text-[#1E293B]">
            {region.id} — {regionLabel(region)}
          </span>
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Servicios AWS', value: services.length },
          { label: 'Categorías', value: cats },
          { label: 'En uso', value: inUse },
          { label: 'Disponibles', value: available },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-2xl font-semibold text-[#1E293B]">{kpi.value}</p>
            <p className="text-xs text-[#64748B]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o categoría..."
            aria-label="Buscar servicio"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 text-[#64748B]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por categoría">
          {serviceCategories.map((cat) => {
            const n = countFor(cat);
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                aria-pressed={active}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : `bg-white border border-[#E2E8F0] hover:border-slate-300 ${
                        n === 0 ? 'text-slate-300' : 'text-[#64748B]'
                      }`
                }`}
              >
                {cat} <span className={active ? 'text-blue-100' : 'text-slate-400'}>({n})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#64748B]" aria-live="polite">
          <span>
            Mostrando <b className="text-[#1E293B]">{filtered.length}</b> de {services.length} servicios
          </span>
          {filtersActive && (
            <button onClick={clearFilters} className="text-[#2563EB] font-medium hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Catalog grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((svc) => {
          const Icon = iconMap[svc.icon] || Server;
          return (
            <div
              key={svc.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E293B]">{svc.name}</h3>
                    <p className="text-xs text-[#64748B]">{svc.category}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isUp(svc.id) ? 'bg-green-50 text-[#16A34A]' : 'bg-slate-100 text-[#64748B]'
                  }`}
                >
                  {isUp(svc.id) ? '● En uso' : 'Disponible'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed flex-1 mb-3">{svc.description}</p>
              <div className="pt-3 border-t border-[#E2E8F0]">
                <p className="text-[10px] uppercase tracking-wider text-[#64748B] mb-0.5">Función principal</p>
                <p className="text-sm font-medium text-[#1E293B]">{svc.mainFunction}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-[#64748B]">
                  <span>
                    Recursos: <b className="text-[#1E293B]">{metrics[svc.id]?.resources ?? 0}</b>
                  </span>
                  <span>
                    Uso: <b className="text-[#1E293B]">{isUp(svc.id) ? `${metrics[svc.id].usage}%` : '—'}</b>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#64748B] text-sm space-y-2">
          <p>No se encontraron servicios con los filtros aplicados.</p>
          <button onClick={clearFilters} className="text-[#2563EB] font-medium hover:underline">
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}