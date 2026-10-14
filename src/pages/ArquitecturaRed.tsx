import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe2, Cloud, Network, Server, Database, HardDrive, ArrowDown, Shield, Users, Layers, MapPin,
  DollarSign, Loader2, RefreshCw, Router, Lock, ArrowRight, Pencil,
} from 'lucide-react';
import { useRegion } from '../context/useRegion';
import { usePersistentState } from '../hooks/usePersistentState';
import { regionLabel, regionStatusLabel, type RegionData } from '../data/regionData';
import Select from '../components/common/Select';
import { fetchProposals } from '../api/proposals';
import type { Proposal } from '../components/planificacion/planTypes';
import { serviceCost } from '../utils/chartData';

/** 'Route 53' / 'route53' / 'CloudFront' → 'route53' / 'cloudfront' */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

const statusStyle = {
  operational: 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30',
  review: 'bg-amber-50 dark:bg-amber-500/10 text-[#D97706] border-amber-200 dark:border-amber-500/30',
  issue: 'bg-red-50 dark:bg-red-500/10 text-[#DC2626] border-red-200 dark:border-red-500/30',
} as const;

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Topology {
  has: (id: string) => boolean;
  vpc: boolean;
  cidr: string;
  azs: { id: string; city: string; publicCidr: string; privateCidr: string }[];
  multiAz: boolean;
  edges: { from: string; to: string; detail: string }[];
  securityGroups: { name: string; attached: string; inbound: string; source: string }[];
  networkComponents: number;
  subnets: number;
}

/** Topología de red derivada SOLO de los servicios seleccionados en la planificación. */
function buildTopology(p: Proposal, region: RegionData | undefined, regionIndex: number): Topology {
  const set = new Set(p.selected.map(norm));
  const has = (id: string) => set.has(id);
  const vpc = has('ec2') || has('rds') || has('vpc');
  const multiAz = p.availability === 'Alta';
  const octet = (regionIndex * 16 + (p.id % 16)) % 250;
  const cidr = `10.${octet}.0.0/16`;
  const azSource = region?.azs.length ? region.azs : [{ id: `${p.regionId}a`, city: '' }];
  const azs = azSource.slice(0, multiAz ? 2 : 1).map((az, i) => ({
    id: az.id,
    city: az.city,
    publicCidr: `10.${octet}.${i + 1}.0/24`,
    privateCidr: `10.${octet}.${i + 11}.0/24`,
  }));

  // Punto de entrada: el primer componente que recibe a los usuarios
  const entry = has('route53') ? 'Route 53' : has('cloudfront') ? 'CloudFront' : has('ec2') ? 'Internet Gateway' : null;
  const edges: Topology['edges'] = [];
  if (entry) edges.push({ from: 'Usuarios', to: entry, detail: entry === 'Route 53' ? 'Resolución DNS del dominio' : 'Tráfico HTTPS' });
  if (has('route53') && has('cloudfront')) edges.push({ from: 'Route 53', to: 'CloudFront', detail: 'Registro alias hacia la distribución' });
  if (has('route53') && !has('cloudfront') && has('ec2')) edges.push({ from: 'Route 53', to: 'Internet Gateway', detail: 'Registro A hacia la IP pública' });
  if (has('cloudfront') && has('ec2')) edges.push({ from: 'CloudFront', to: 'EC2', detail: 'Origen dinámico (HTTPS 443)' });
  if (has('cloudfront') && has('s3')) edges.push({ from: 'CloudFront', to: 'S3', detail: 'Origen estático con Origin Access Control' });
  if (has('ec2')) edges.push({ from: 'Internet Gateway', to: 'EC2', detail: 'Subred pública' });
  if (has('ec2') && has('rds')) edges.push({ from: 'EC2', to: 'RDS', detail: 'Puerto 5432 dentro de la VPC' });
  if (has('ec2') && has('s3')) edges.push({ from: 'EC2', to: 'S3', detail: 'VPC Endpoint (gateway), sin salir a Internet' });
  if (multiAz && has('rds')) edges.push({ from: 'RDS primaria', to: 'RDS standby', detail: 'Replicación síncrona Multi-AZ' });

  const securityGroups: Topology['securityGroups'] = [];
  if (has('ec2'))
    securityGroups.push({
      name: 'sg-web',
      attached: 'EC2',
      inbound: 'TCP 443',
      source: has('cloudfront') ? 'Prefijos de CloudFront' : '0.0.0.0/0',
    });
  if (has('rds')) securityGroups.push({ name: 'sg-db', attached: 'RDS', inbound: 'TCP 5432', source: has('ec2') ? 'sg-web' : 'Rango de la VPC' });

  const networkComponents =
    ['route53', 'cloudfront'].filter(has).length + (vpc ? 1 : 0) + (has('ec2') ? 1 : 0) /* IGW */ + (has('s3') && vpc ? 1 : 0) /* endpoint */;
  const subnets = vpc ? azs.length * ((has('ec2') ? 1 : 0) + (has('rds') ? 1 : 0) || 1) : 0;

  return { has, vpc, cidr, azs, multiAz, edges, securityGroups, networkComponents, subnets };
}

function Node({ icon: Icon, label, caption, cls }: { icon: React.ComponentType<{ className?: string }>; label: string; caption?: string; cls: string }) {
  return (
    <div className="w-full max-w-xs">
      <div className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm ${cls}`}>
        <Icon className="w-4 h-4" />
        {label}
      </div>
      {caption && <p className="text-[10px] text-center text-text-secondary mt-1">{caption}</p>}
    </div>
  );
}

const Down = () => (
  <div className="flex flex-col items-center py-1">
    <div className="w-0.5 h-5 bg-border" />
    <ArrowDown className="w-4 h-4 text-text-secondary -mt-1" />
  </div>
);

function Resource({ icon: Icon, label, sub, cls }: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string; cls: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${cls}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div className="min-w-0">
        <p>{label}</p>
        <p className="text-[10px] font-normal opacity-80 truncate">{sub}</p>
      </div>
    </div>
  );
}

export default function ArquitecturaRed() {
  const { regions, regionId } = useRegion();
  const [plannings, setPlannings] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = usePersistentState<number | null>(
    'network-planning',
    null,
    (v): v is number | null => v === null || typeof v === 'number'
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlannings(await fetchProposals());
    } catch (e) {
      setPlannings([]);
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Planificación mostrada: la elegida; si no existe, la primera de la región actual; si no, la primera.
  const planning =
    plannings.find((p) => p.id === selectedId) ?? plannings.find((p) => p.regionId === regionId) ?? plannings[0] ?? null;
  const region = regions.find((r) => r.id === planning?.regionId);
  const topo = useMemo(
    () => (planning ? buildTopology(planning, region, Math.max(regions.findIndex((r) => r.id === planning.regionId), 0)) : null),
    [planning, region, regions]
  );
  const monthly = planning
    ? +planning.selected.reduce((s, sel) => s + (serviceCost(sel)?.monthly ?? 0), 0).toFixed(2)
    : 0;

  const options = plannings.map((p) => ({ value: String(p.id), label: `${p.name} · ${p.regionId}` }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Arquitectura de Red</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Topología de red de cada planificación guardada, generada con los servicios que tiene seleccionados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-text-main hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 self-start"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Actualizar
        </button>
      </div>

      {error && (
        <div className={`rounded-xl border p-4 text-sm ${statusStyle.issue}`}>No se pudieron cargar las planificaciones: {error}</div>
      )}

      {!loading && !error && plannings.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Network className="w-8 h-8 mx-auto text-text-secondary opacity-40" />
          <p className="text-sm font-medium text-text-main mt-2">Aún no hay planificaciones</p>
          <p className="text-xs text-text-secondary mt-1">
            Crea una en{' '}
            <Link to="/planificacion" className="text-primary font-medium">
              Planificación Cloud
            </Link>{' '}
            y aquí verás su arquitectura de red.
          </p>
        </div>
      )}

      {planning && topo && (
        <>
          {/* Selector + datos de la planificación */}
          <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Servidor / planificación</label>
              <Select
                ariaLabel="Planificación"
                value={String(planning.id)}
                onChange={(v) => setSelectedId(Number(v))}
                options={options}
              />
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="min-w-0">
                <dt className="text-xs text-text-secondary">Tipo</dt>
                <dd className="font-medium text-text-main truncate">{planning.type}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-text-secondary">Región</dt>
                <dd className="font-medium text-text-main truncate" title={region ? regionLabel(region) : planning.region}>
                  {planning.regionId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Estado</dt>
                <dd>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyle[region?.status ?? 'operational']}`}>
                    {regionStatusLabel[region?.status ?? 'operational']}
                  </span>
                </dd>
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <dt className="text-xs text-text-secondary">Creada</dt>
                  <dd className="font-medium text-text-main truncate">{planning.createdAt}</dd>
                </div>
                <Link
                  to="/planificacion"
                  title="Editar servicios en Planificación"
                  className="p-1.5 rounded-md border border-border text-text-secondary hover:text-primary shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              </div>
            </dl>
          </div>

          {/* KPIs de esta planificación */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Servicios', value: planning.selected.length, icon: Layers, color: 'text-[#2563EB]' },
              { label: 'Componentes de red', value: topo.networkComponents, icon: Network, color: 'text-[#8B5CF6]' },
              { label: 'Subredes', value: topo.subnets, icon: Router, color: 'text-[#0EA5E9]' },
              { label: 'Zonas de disponibilidad', value: topo.vpc ? topo.azs.length : 0, icon: MapPin, color: 'text-[#16A34A]' },
              { label: 'Costo mensual', value: usd(monthly), icon: DollarSign, color: 'text-[#F59E0B]' },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-card rounded-xl border border-border p-4">
                  <Icon className={`w-4 h-4 ${k.color} mb-2`} />
                  <p className="text-xl font-semibold text-text-main tabular-nums">{k.value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{k.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Diagrama */}
            <div className="xl:col-span-2 bg-card rounded-xl border border-border p-5 lg:p-6 overflow-x-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-text-main">Diagrama — {planning.name}</h2>
                <span className="text-[11px] text-text-secondary">{topo.multiAz ? 'Alta disponibilidad (Multi-AZ)' : 'Una zona de disponibilidad'}</span>
              </div>

              <div className="flex flex-col items-center min-w-[520px]">
                <Node icon={Users} label="Usuarios / Internet" cls="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" />

                {topo.has('route53') && (
                  <>
                    <Down />
                    <Node icon={Globe2} label="Route 53" caption="DNS · servicio global" cls="bg-slate-800 dark:bg-slate-700 text-white" />
                  </>
                )}
                {topo.has('cloudfront') && (
                  <>
                    <Down />
                    <Node icon={Cloud} label="CloudFront" caption="CDN · ubicaciones de borde" cls="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300" />
                  </>
                )}

                {(topo.vpc || topo.has('s3')) && <Down />}

                {/* Región AWS */}
                {(topo.vpc || topo.has('s3')) && (
                  <div className="w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-4">
                    <p className="text-[11px] font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Región AWS · {planning.regionId}
                      {region ? ` — ${regionLabel(region)}` : ''}
                    </p>

                    <div className={`grid gap-4 ${topo.vpc && topo.has('s3') ? 'grid-cols-[1fr_auto]' : 'grid-cols-1'}`}>
                      {topo.vpc && (
                        <div className="rounded-xl border-2 border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-500/5 p-3">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                              <Network className="w-4 h-4" /> VPC {topo.cidr}
                            </p>
                            {topo.has('ec2') && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-border text-text-secondary flex items-center gap-1">
                                <Router className="w-3 h-3" /> Internet Gateway
                              </span>
                            )}
                          </div>

                          <div className={`grid gap-3 ${topo.azs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {topo.azs.map((az, i) => (
                              <div key={az.id} className="rounded-lg border border-border bg-card p-2.5 space-y-2">
                                <p className="text-[10px] font-semibold text-text-secondary">
                                  Zona {az.id}
                                  {az.city ? ` · ${az.city}` : ''}
                                </p>
                                {topo.has('ec2') && (
                                  <div className="rounded-md border border-green-200 dark:border-green-500/30 bg-green-50/60 dark:bg-green-500/5 p-2">
                                    <p className="text-[10px] font-medium text-[#16A34A] mb-1.5">Subred pública {az.publicCidr}</p>
                                    <Resource icon={Server} label={`EC2 · web-${i + 1}`} sub="sg-web" cls="bg-orange-50 dark:bg-orange-500/10 text-[#D97706]" />
                                  </div>
                                )}
                                {(topo.has('rds') || !topo.has('ec2')) && (
                                  <div className="rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 p-2">
                                    <p className="text-[10px] font-medium text-text-secondary mb-1.5 flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> Subred privada {az.privateCidr}
                                    </p>
                                    {topo.has('rds') ? (
                                      <Resource
                                        icon={Database}
                                        label={i === 0 ? 'RDS · primaria' : 'RDS · standby'}
                                        sub="sg-db · sin IP pública"
                                        cls="bg-green-50 dark:bg-green-500/10 text-[#16A34A]"
                                      />
                                    ) : (
                                      <p className="text-[10px] text-text-secondary">Sin recursos</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {topo.has('s3') && (
                        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 p-3 min-w-[130px]">
                          <HardDrive className="w-5 h-5 text-[#2563EB]" />
                          <p className="text-xs font-semibold text-[#2563EB]">S3</p>
                          <p className="text-[10px] text-text-secondary text-center">
                            Servicio regional
                            {topo.vpc && topo.has('ec2') ? (
                              <>
                                <br />
                                vía VPC Endpoint
                              </>
                            ) : null}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {topo.has('iam') && (
                  <div className="mt-4 w-full flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5 px-3 py-2 text-xs text-[#DC2626]">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>IAM</strong> · roles de instancia y políticas de mínimo privilegio aplicados a todos los recursos de la planificación
                    </span>
                  </div>
                )}

                {!topo.vpc && !topo.has('s3') && !topo.has('route53') && !topo.has('cloudfront') && (
                  <p className="mt-4 text-xs text-text-secondary text-center">
                    Esta planificación no incluye servicios de red. Agrega EC2, RDS, S3, CloudFront o Route 53 en Planificación.
                  </p>
                )}
              </div>
            </div>

            {/* Panel lateral: flujo y grupos de seguridad */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-text-main mb-3">Flujo de tráfico</h2>
                {topo.edges.length === 0 ? (
                  <p className="text-xs text-text-secondary">Sin conexiones de red.</p>
                ) : (
                  <ol className="space-y-2.5">
                    {topo.edges.map((e) => (
                      <li key={`${e.from}-${e.to}`} className="text-xs">
                        <p className="flex items-center gap-1.5 font-medium text-text-main">
                          {e.from} <ArrowRight className="w-3 h-3 text-text-secondary" /> {e.to}
                        </p>
                        <p className="text-text-secondary mt-0.5">{e.detail}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-text-main mb-3">Security Groups</h2>
                {topo.securityGroups.length === 0 ? (
                  <p className="text-xs text-text-secondary">No aplica (sin recursos dentro de la VPC).</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-text-secondary border-b border-border">
                        <th className="pb-1.5 font-medium">Grupo</th>
                        <th className="pb-1.5 font-medium">Entrada</th>
                        <th className="pb-1.5 font-medium">Origen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topo.securityGroups.map((sg) => (
                        <tr key={sg.name} className="border-b border-border last:border-0">
                          <td className="py-1.5 font-mono text-text-main">
                            {sg.name}
                            <span className="block font-sans text-[10px] text-text-secondary">{sg.attached}</span>
                          </td>
                          <td className="py-1.5 text-text-main">{sg.inbound}</td>
                          <td className="py-1.5 text-text-secondary">{sg.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-text-main mb-3">Servicios de la planificación</h2>
                <div className="flex flex-wrap gap-1.5">
                  {planning.selected.map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-text-main">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}