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
} from 'lucide-react';
import { services } from '../data/mockData';

const iconMap: Record<string, React.ElementType> = {
  Server,
  HardDrive,
  Database,
  Shield,
  Network,
  Globe: Globe2,
  Cloud,
};

const categories = ['All', 'Compute', 'Storage', 'Database', 'Security', 'Networking'];

export default function Servicios() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || s.category === category;
    return matchSearch && matchCat;
  });

  const inUse = services.filter((s) => s.status === 'in-use').length;
  const available = services.filter((s) => s.status === 'available').length;
  const cats = new Set(services.map((s) => s.category)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1E293B]">Servicios AWS</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Catálogo de servicios AWS utilizados en la solución Cloud
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'AWS Services', value: services.length },
          { label: 'Categories', value: cats },
          { label: 'In Use', value: inUse },
          { label: 'Available', value: available },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-2xl font-semibold text-[#1E293B]">{kpi.value}</p>
            <p className="text-xs text-[#64748B]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                category === cat
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
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
                    svc.status === 'in-use'
                      ? 'bg-green-50 text-[#16A34A]'
                      : 'bg-slate-100 text-[#64748B]'
                  }`}
                >
                  {svc.status === 'in-use' ? '● In Use' : 'Available'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed flex-1 mb-3">
                {svc.description}
              </p>
              <div className="pt-3 border-t border-[#E2E8F0]">
                <p className="text-[10px] uppercase tracking-wider text-[#64748B] mb-0.5">
                  Main function
                </p>
                <p className="text-sm font-medium text-[#1E293B]">{svc.mainFunction}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#64748B] text-sm">
          No se encontraron servicios con los filtros aplicados.
        </div>
      )}
    </div>
  );
}
