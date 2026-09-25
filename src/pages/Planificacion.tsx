import { useState } from 'react';
import { useRegion } from '../context/useRegion';
import { useNotifications } from '../context/useNotifications';
import { usePersistentState } from '../hooks/usePersistentState';
import { regionLabel as fmtRegion } from '../data/regionData';
import { Cloud, Server, Database, HardDrive, Globe2, Shield } from 'lucide-react';
import PlanForm, { type PlanFormState } from '../components/planificacion/PlanForm';
import ProposalList from '../components/planificacion/ProposalList';
import ProposalSummary from '../components/planificacion/ProposalSummary';
import ArchitecturePreview from '../components/planificacion/ArchitecturePreview';
import { isProposalList, type Proposal } from '../components/planificacion/planTypes';

const availableServices = [
  { id: 'ec2', name: 'EC2', icon: Server },
  { id: 'rds', name: 'RDS', icon: Database },
  { id: 's3', name: 'S3', icon: HardDrive },
  { id: 'cloudfront', name: 'CloudFront', icon: Cloud },
  { id: 'route53', name: 'Route 53', icon: Globe2 },
  { id: 'iam', name: 'IAM', icon: Shield },
];

export default function Planificacion() {
  const { regionId, regions } = useRegion();
  const { notify } = useNotifications();
  const regionLabels: Record<string, string> = Object.fromEntries(regions.map((r) => [r.id, fmtRegion(r)]));

  const [form, setForm] = useState<PlanFormState>({
    name: 'Aplicación Web Empresarial',
    type: 'Aplicación Web SaaS',
    description: 'Aplicación web empresarial de alta disponibilidad con base de datos gestionada y CDN global.',
    region: regionId,
    users: '5000',
    availability: 'Alta',
    migration: 'Escalabilidad y Reducción de Costos',
    selected: ['ec2', 'rds', 's3', 'cloudfront', 'route53'],
  });
  const [saved, setSaved] = useState(false);
  const [savedProposals, setSavedProposals] = usePersistentState<Proposal[]>('proposals', [], isProposalList);
  const [selectedProposalId, setSelectedProposalId] = usePersistentState<number | null>(
    'proposal-selected',
    null,
    (v): v is number | null => v === null || typeof v === 'number'
  );

  const toggleService = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selected: prev.selected.includes(id) ? prev.selected.filter((s) => s !== id) : [...prev.selected, id],
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
      createdAt: new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setSavedProposals((prev) => [newProposal, ...prev]);
    setSelectedProposalId(newProposal.id);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
    notify({
      type: 'success',
      title: 'Propuesta guardada',
      message: newProposal.name ? `«${newProposal.name}» se añadió a tus propuestas.` : 'Se añadió a tus propuestas.',
    });
  };

  // Si hay una propuesta guardada seleccionada, el resumen muestra esos datos.
  // Si no, muestra en vivo lo que se está editando en el formulario.
  const selectedProposal = savedProposals.find((p) => p.id === selectedProposalId) ?? null;

  const summary = selectedProposal ?? {
    name: form.name,
    type: form.type,
    region: regionLabels[form.region] || form.region,
    users: form.users,
    availability: form.availability,
    migration: form.migration,
    selected: form.selected,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-main">Planificación Cloud</h1>
        <p className="text-sm text-text-secondary mt-0.5">Diseña y planifica la solución Cloud según los requisitos del negocio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <PlanForm
          form={form}
          regions={regions}
          services={availableServices}
          regionLabel={fmtRegion}
          onChange={handleChange}
          onToggleService={toggleService}
          onSave={handleSave}
          saved={saved}
        />

        <div className="lg:col-span-2 space-y-4">
          <ProposalList
            proposals={savedProposals}
            selectedId={selectedProposalId}
            onSelect={(id) => {
              setSelectedProposalId(id);
              setSaved(false);
            }}
          />
          <ProposalSummary summary={summary} services={availableServices} isSaved={selectedProposal !== null} />
          <ArchitecturePreview selected={summary.selected} />
        </div>
      </div>
    </div>
  );
}