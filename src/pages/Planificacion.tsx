import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegion } from '../context/useRegion';
import { useNotifications } from '../context/useNotifications';
import { usePersistentState } from '../hooks/usePersistentState';
import { regionLabel as fmtRegion } from '../data/regionData';
import { Cloud, Server, Database, HardDrive, Globe2, Shield, MapPin, Loader2 } from 'lucide-react';
import PlanForm, { type PlanFormState } from '../components/planificacion/PlanForm';
import ProposalList from '../components/planificacion/ProposalList';
import ProposalSummary from '../components/planificacion/ProposalSummary';
import ArchitecturePreview from '../components/planificacion/ArchitecturePreview';
import { type Proposal } from '../components/planificacion/planTypes';
import {
  applyProposalToCostsApi,
  createProposal,
  fetchProposals,
} from '../api/proposals';
import {
  fetchIpLocation,
  getDevicePosition,
  placeFromIp,
  recommendRegion,
  reverseGeocode,
  type Place,
  type RegionRecommendation,
} from '../api/geo';

const availableServices = [
  { id: 'ec2', name: 'EC2', icon: Server },
  { id: 'rds', name: 'RDS', icon: Database },
  { id: 's3', name: 'S3', icon: HardDrive },
  { id: 'cloudfront', name: 'CloudFront', icon: Cloud },
  { id: 'route53', name: 'Route 53', icon: Globe2 },
  { id: 'iam', name: 'IAM', icon: Shield },
];

const ID_TO_NAME: Record<string, string> = {
  ec2: 'EC2',
  rds: 'RDS',
  s3: 'S3',
  cloudfront: 'CloudFront',
  route53: 'Route 53',
  iam: 'IAM',
  vpc: 'VPC',
};

export default function Planificacion() {
  const { regionId, regions, setRegionId } = useRegion();
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const regionLabels: Record<string, string> = Object.fromEntries(
    regions.map((r) => [r.id, fmtRegion(r)])
  );

  const [form, setForm] = useState<PlanFormState>({
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
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedProposals, setSavedProposals] = useState<Proposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = usePersistentState<number | null>(
    'proposal-selected',
    null,
    (v): v is number | null => v === null || typeof v === 'number'
  );

  const [locating, setLocating] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [recommendation, setRecommendation] = useState<RegionRecommendation | null>(null);

  const loadProposals = useCallback(async () => {
    try {
      const list = await fetchProposals();
      setSavedProposals(list);
    } catch (e) {
      notify({
        type: 'error',
        title: 'No se pudieron cargar las propuestas',
        message: e instanceof Error ? e.message : 'Error de red o del backend',
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  const detectLocationAndRecommend = async () => {
    setLocating(true);
    try {
      let lat: number;
      let lon: number;
      let ipPlace: Place | null = null;
      let viaIp = false;
      try {
        const pos = await getDevicePosition();
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        // Sin GPS (permiso bloqueado, PC del aula…): ubicación aproximada por IP
        const ip = await fetchIpLocation();
        lat = ip.lat;
        lon = ip.lon;
        ipPlace = placeFromIp(ip);
        viaIp = true;
      }

      const [placeRes, rec] = await Promise.all([
        ipPlace ?? reverseGeocode(lat, lon),
        recommendRegion(lat, lon),
      ]);

      setPlace(placeRes);
      setRecommendation(rec);
      setForm((prev) => ({ ...prev, region: rec.regionId }));
      setRegionId(rec.regionId);

      notify({
        type: 'success',
        title: 'Región recomendada',
        message: viaIp ? `${rec.message} (ubicación aproximada por IP)` : rec.message,
      });
    } catch (e) {
      notify({
        type: 'error',
        title: 'No se pudo obtener la ubicación',
        message:
          e instanceof Error
            ? e.message
            : 'No se pudo usar el GPS ni la ubicación por IP. Inténtalo de nuevo.',
      });
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    void detectLocationAndRecommend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const created = await createProposal({
        name: form.name,
        type: form.type,
        description: form.description || '',
        regionId: form.region,
        users: form.users,
        availability: form.availability,
        migration: form.migration,
        selected: form.selected.map((id) => ID_TO_NAME[id] ?? id),
      });
      setSavedProposals((prev) => [created, ...prev]);
      setSelectedProposalId(created.id);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 4000);
      notify({
        type: 'success',
        title: 'Propuesta guardada en Supabase',
        message: created.name
          ? `«${created.name}» se guardó en la base de datos.`
          : 'Propuesta guardada.',
      });
    } catch (e) {
      notify({
        type: 'error',
        title: 'Error al guardar',
        message: e instanceof Error ? e.message : 'No se pudo guardar la propuesta',
      });
    } finally {
      setSaving(false);
    }
  };

  const applyProposalToCosts = async () => {
    const proposal = savedProposals.find((p) => p.id === selectedProposalId);
    if (!proposal) return;

    setApplying(true);
    try {
      const result = await applyProposalToCostsApi(proposal.id);
      if (result.regionId && result.regionId !== regionId) {
        setRegionId(result.regionId);
      }
      notify({
        type: 'success',
        title: 'Costos actualizados',
        message: `Se aplicó «${proposal.name}» a la calculadora (${proposal.region}).`,
      });
      navigate('/costos');
    } catch (e) {
      notify({
        type: 'error',
        title: 'No se pudo aplicar a costos',
        message: e instanceof Error ? e.message : 'Error del backend',
      });
    } finally {
      setApplying(false);
    }
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
          Las propuestas se guardan en Supabase y alimentan Costos y el Dashboard. La región se
          recomienda según tu ubicación (GPS o, si no está disponible, aproximada por IP).
        </p>
        {loading && <p className="text-xs text-text-secondary mt-1">Cargando propuestas…</p>}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-main">Ubicación y servidor recomendado</p>
            {recommendation ? (
              <p className="text-xs text-text-secondary mt-0.5">
                {recommendation.message}
                {place?.district || place?.address ? (
                  <>
                    {' '}
                    · Tu zona:{' '}
                    <span className="text-text-main">
                      {[place.address, place.district, place.area].filter(Boolean).join(', ')}
                    </span>
                  </>
                ) : null}
              </p>
            ) : (
              <p className="text-xs text-text-secondary mt-0.5">
                Usa el GPS del dispositivo (o tu IP si no está disponible) para sugerir la región AWS
                más cercana (ej. São Paulo desde Perú).
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void detectLocationAndRecommend()}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-60 shrink-0"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {locating ? 'Detectando…' : 'Detectar mi ubicación'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <PlanForm
          form={form}
          regions={regions}
          services={availableServices}
          regionLabel={fmtRegion}
          onChange={handleChange}
          onToggleService={toggleService}
          onSave={() => void handleSave()}
          saved={saved || saving}
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
            onApplyToCosts={selectedProposal ? () => void applyProposalToCosts() : undefined}
            applying={applying}
          />
          <ArchitecturePreview selected={summary.selected} />
        </div>
      </div>
    </div>
  );
}