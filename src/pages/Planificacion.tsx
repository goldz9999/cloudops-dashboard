import { useState } from 'react';
import { useRegion } from '../context/useRegion';
import { regionLabel as fmtRegion } from '../data/regionData';
import { Cloud, Check, Server, Database, HardDrive, Globe2, Shield, FolderClock, Plus } from 'lucide-react';

const availableServices = [
  { id: 'ec2', name: 'EC2', icon: Server },
  { id: 'rds', name: 'RDS', icon: Database },
  { id: 's3', name: 'S3', icon: HardDrive },
  { id: 'cloudfront', name: 'CloudFront', icon: Cloud },
  { id: 'route53', name: 'Route 53', icon: Globe2 },
  { id: 'iam', name: 'IAM', icon: Shield },
];

interface Proposal {
  id: number;
  name: string;
  type: string;
  region: string;
  users: string;
  availability: string;
  migration: string;
  selected: string[];
  createdAt: string;
}

export default function Planificacion() {
  const { regionId, regions } = useRegion();
  const regionLabels: Record<string, string> = Object.fromEntries(regions.map((r) => [r.id, fmtRegion(r)]));
  const [form, setForm] = useState({
    name: 'Aplicación Web Empresarial',
    type: 'Aplicación Web SaaS',
    description:
      'Aplicación web empresarial de alta disponibilidad con base de datos gestionada y CDN global.',
    region: regionId,
    users: '5000',
    availability: 'Alta',
    migration: 'Escalabilidad y Reducción de Costos',
    selected: ['ec2', 'rds', 's3', 'cloudfront', 'route53'],
  });
  const [saved, setSaved] = useState(false);
  const [savedProposals, setSavedProposals] = useState<Proposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);

  const toggleService = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selected: prev.selected.includes(id)
        ? prev.selected.filter((s) => s !== id)
        : [...prev.selected, id],
    }));
    setSaved(false);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    const newProposal: Proposal = {
      id: Date.now(),
      name: form.name,
      type: form.type,
      region: regionLabels[form.region] || form.region,
      users: form.users,
      availability: form.availability,
      migration: form.migration,
      selected: form.selected,
      createdAt: new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setSavedProposals((prev) => [newProposal, ...prev]);
    setSelectedProposalId(newProposal.id);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  };

  // Si hay una propuesta guardada seleccionada, el resumen muestra esos datos.
  // Si no, muestra en vivo lo que se está editando en el formulario.
  const selectedProposal = savedProposals.find((p) => p.id === selectedProposalId) ?? null;

  const summary = selectedProposal
    ? selectedProposal
    : {
        name: form.name,
        type: form.type,
        region: regionLabels[form.region] || form.region,
        users: form.users,
        availability: form.availability,
        migration: form.migration,
        selected: form.selected,
      };

  const summaryServices = availableServices.filter((s) => summary.selected.includes(s.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1E293B]">Planificación Cloud</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Diseña y planifica la solución Cloud según los requisitos del negocio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Form - Left */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-5">
          <h2 className="text-sm font-semibold text-[#1E293B]">Formulario de planificación</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Nombre de la solución
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Tipo de aplicación
              </label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              >
                <option>E-commerce / Tienda Online</option>
                <option>Sistema Empresarial (ERP/CRM)</option>
                <option>Aplicación Web SaaS</option>
                <option>Big Data y Analítica</option>
                <option>API y Backend Móvil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">Región</label>
              <select
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {fmtRegion(r)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Usuarios estimados
              </label>
              <input
                type="number"
                value={form.users}
                onChange={(e) => handleChange('users', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Disponibilidad requerida
              </label>
              <select
                value={form.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              >
                <option>Alta</option>
                <option>Media</option>
                <option>Estándar</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Objetivo de migración
              </label>
              <select
                value={form.migration}
                onChange={(e) => handleChange('migration', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              >
                <option value="Escalabilidad y Reducción de Costos">Escalabilidad y Reducción de Costos</option>
                <option value="Escalabilidad y Rendimiento Global">Escalabilidad y Rendimiento Global</option>
                <option value="Modernización y Agilidad">Modernización y Agilidad</option>
                <option value="Alta Disponibilidad y Resiliencia">Alta Disponibilidad y Resiliencia</option>
                <option value="Cumplimiento y Seguridad">Cumplimiento y Seguridad</option>
              </select>
            </div>
          </div>

          {/* Service selection */}
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-2">
              Servicios seleccionados
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableServices.map((svc) => {
                const Icon = svc.icon;
                const selected = form.selected.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => toggleService(svc.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      selected
                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                        : 'border-[#E2E8F0] text-[#64748B] hover:border-slate-300'
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
            onClick={handleSave}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar propuesta
          </button>

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#16A34A]">Propuesta guardada</p>
                <p className="text-xs text-green-700 mt-0.5">
                  La solución &quot;{form.name}&quot; ha sido registrada correctamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary - Right */}
        <div className="lg:col-span-2 space-y-4">
          {/* Saved proposals list */}
          {savedProposals.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-1.5">
                  <FolderClock className="w-4 h-4 text-[#2563EB]" />
                  Propuestas guardadas
                </h3>
                <span className="text-[10px] text-[#94A3B8]">Se pierden al recargar</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selectedProposalId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProposalId(null);
                      setSaved(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#93C5FD] bg-blue-50/60 text-[#2563EB] text-sm font-medium hover:bg-blue-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ver propuesta nueva (en edición)
                  </button>
                )}
                {savedProposals.map((p) => {
                  const isActive = p.id === selectedProposalId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProposalId(p.id);
                        setSaved(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        isActive
                          ? 'border-[#2563EB] bg-blue-50'
                          : 'border-[#E2E8F0] bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1E293B] truncate">{p.name}</p>
                        <p className="text-[11px] text-[#64748B]">
                          {p.type} · {p.region} · {Number(p.users || 0).toLocaleString()} usuarios
                        </p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">Creada: {p.createdAt}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100">
                        {p.selected.length} servicios
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#1E293B]">Resumen de la propuesta</h2>
              {selectedProposal && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B]">
                  Guardada
                </span>
              )}
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[#64748B]">Solución Cloud</dt>
                <dd className="font-medium text-[#1E293B] text-right max-w-[60%] truncate">
                  {summary.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Tipo</dt>
                <dd className="font-medium text-[#1E293B]">{summary.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Región</dt>
                <dd className="font-medium text-[#1E293B]">{summary.region}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Usuarios</dt>
                <dd className="font-medium text-[#1E293B]">
                  {Number(summary.users).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Disponibilidad</dt>
                <dd className="font-medium text-[#1E293B]">{summary.availability}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Migración</dt>
                <dd className="font-medium text-[#1E293B]">{summary.migration}</dd>
              </div>
            </dl>

            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <p className="text-xs font-medium text-[#64748B] mb-2">Servicios seleccionados</p>
              <div className="flex flex-wrap gap-2">
                {summaryServices.map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <div
                      key={svc.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-50 text-[#2563EB] text-xs font-medium"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {svc.name}
                    </div>
                  );
                })}
                {summaryServices.length === 0 && (
                  <p className="text-xs text-[#64748B]">Ningún servicio seleccionado</p>
                )}
              </div>
            </div>
          </div>

          {/* Architecture preview */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Resumen de arquitectura</h3>
            <div className="flex flex-row flex-wrap items-center gap-1.5 text-xs overflow-x-auto pb-1">
              {summary.selected.includes('route53') && (
                <>
                  <div className="px-3 py-1.5 rounded bg-slate-100 text-slate-600 font-medium whitespace-nowrap">
                    Route 53
                  </div>
                  <span className="text-[#CBD5E1]">→</span>
                </>
              )}
              {summary.selected.includes('cloudfront') && (
                <>
                  <div className="px-3 py-1.5 rounded bg-purple-50 text-purple-600 font-medium whitespace-nowrap">
                    CloudFront
                  </div>
                  <span className="text-[#CBD5E1]">→</span>
                </>
              )}
              <div className="px-3 py-1.5 rounded bg-indigo-50 text-indigo-600 font-medium whitespace-nowrap">
                VPC
              </div>
              {(summary.selected.includes('ec2') || summary.selected.includes('rds')) && (
                <>
                  <span className="text-[#CBD5E1]">→</span>
                  <div className="flex gap-1.5">
                    {summary.selected.includes('ec2') && (
                      <div className="px-2.5 py-1 rounded bg-orange-50 text-[#F59E0B] font-medium whitespace-nowrap">
                        EC2
                      </div>
                    )}
                    {summary.selected.includes('rds') && (
                      <div className="px-2.5 py-1 rounded bg-green-50 text-[#16A34A] font-medium whitespace-nowrap">
                        RDS
                      </div>
                    )}
                  </div>
                </>
              )}
              {summary.selected.includes('s3') && (
                <>
                  <span className="text-[#CBD5E1]">→</span>
                  <div className="px-2.5 py-1 rounded bg-blue-50 text-[#2563EB] font-medium whitespace-nowrap">
                    S3
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}