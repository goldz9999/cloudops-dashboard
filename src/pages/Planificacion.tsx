import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegion } from '../context/useRegion';
import { useNotifications } from '../context/useNotifications';
import { usePersistentState } from '../hooks/usePersistentState';
import { regionLabel as fmtRegion, type CostRow } from '../data/regionData';
import { Cloud, Server, Database, HardDrive, Globe2, Shield } from 'lucide-react';
import PlanForm, { type PlanFormState } from '../components/planificacion/PlanForm';
import ProposalList from '../components/planificacion/ProposalList';
import ProposalSummary from '../components/planificacion/ProposalSummary';
import ArchitecturePreview from '../components/planificacion/ArchitecturePreview';
import { isProposalList, type Proposal } from '../components/planificacion/planTypes';
import { isRowsByRegion, proposalToCostRows } from '../utils/proposalToCostRows';

const availableServices = [
  { id: 'ec2', name: 'EC2', icon: Server },
  { id: 'rds', name: 'RDS', icon: Database },
  { id: 's3', name: 'S3', icon: HardDrive },
  { id: 'cloudfront', name: 'CloudFront', icon: Cloud },
  { id: 'route53', name: 'Route 53', icon: Globe2 },
  { id: 'iam', name: 'IAM', icon: Shield },
];

export default function Planificacion() {
  const { regionId, regions, setRegionId } = useRegion();
  const { notify } = useNotifications();
  const navigate = useNavigate();
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
  const [applying, setApplying] = useState(false);
  const [savedProposals, setSavedProposals] = usePersistentState<Proposal[]>('proposals', [], isProposalList);
  const [selectedProposalId, setSelectedProposalId] = usePersistentState<number | null>(
    'proposal-selected',
    null,
    (v): v is number | null => v === null || typeof v === 'number'
  );

  // Misma clave que usa Costos.tsx → al aplicar una propuesta se actualiza la calculadora.
  const [, setStoredRows] = usePersistentState<Record<string, CostRow[]>>('costos-rows', {}, isRowsByRegion);

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
      regionId: form.region,
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
    notify({
      type: 'success',
      title: 'Propuesta guardada',
      message: newProposal.name ? `«${newProposal.name}» se añadió a tus propuestas.` : 'Se añadió a tus propuestas.',
    });
  };

  const applyProposalToCosts = () => {
    const proposal = savedProposals.find((p) => p.id === selectedProposalId);
    if (!proposal) return;

    // Preferir regionId; si es una propuesta antigua sin él, intentar resolver por el label.
    let targetRegionId = proposal.regionId;
    if (!targetRegionId) {
      const match = regions.find((r) => fmtRegion(r) === proposal.region || r.id === proposal.region);
      targetRegionId = match?.id ?? regionId;
    }

    const newRows = proposalToCostRows(proposal.selected);
    if (newRows.length === 0) {
      notify({
        type: 'info',
        title: 'Sin costos generados',
        message: 'La propuesta no tiene servicios con tarifa definida.',
      });
      return;
    }

    setApplying(true);
    setStoredRows((prev) => ({
      ...prev,
      [targetRegionId]: newRows,
    }));

    // Cambiar a la región de la propuesta para que en Costos se vea el resultado.
    if (targetRegionId !== regionId) {
      setRegionId(targetRegionId);
    }

    notify({
      type: 'success',
      title: 'Costos actualizados',
      message: `Se aplicó «${proposal.name}» a la calculadora de costos de ${proposal.region}.`,
    });
    window.setTimeout(() => setApplying(false), 600);

    // Ir a la página de Costos para ver el resultado.
    navigate('/costos');
  };

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
        <p className="text-sm text-text-secondary mt-0.5">
          Diseña y planifica la solución Cloud según los requisitos del negocio
        </p>
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
          <ProposalSummary
            summary={summary}
            services={availableServices}
            isSaved={selectedProposal !== null}
            onApplyToCosts={selectedProposal ? applyProposalToCosts : undefined}
            applying={applying}
          />
          <ArchitecturePreview selected={summary.selected} />
        </div>
      </div>
    </div>
  );
}