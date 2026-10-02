import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe2,
  Server,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  X,
  ClipboardList,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useRegion } from '../context/useRegion';
import { fetchProposals } from '../api/proposals';
import type { Proposal } from '../components/planificacion/planTypes';
import { planningByRegion, type RegionPlanning } from '../utils/planningStats';
import { WORLD_MAP_VIEWBOX, geoToMapXY, loadWorldLandPath } from '../data/worldMap';

const statusConfig = {
  operational: {
    label: 'Operativo',
    color: 'bg-[#16A34A]',
    text: 'text-[#16A34A]',
    bg: 'bg-green-50 dark:bg-green-500/10',
    border: 'border-green-200 dark:border-green-500/30',
    pin: '#22C55E',
  },
  review: {
    label: 'Requiere revisión',
    color: 'bg-[#F59E0B]',
    text: 'text-[#F59E0B]',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/30',
    pin: '#F59E0B',
  },
  issue: {
    label: 'Problema',
    color: 'bg-[#DC2626]',
    text: 'text-[#DC2626]',
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-200 dark:border-red-500/30',
    pin: '#EF4444',
  },
};

const { minX, minY, width, height } = WORLD_MAP_VIEWBOX;
const VIEWBOX = `${minX} ${minY} ${width} ${height}`;

const MIN_ZOOM = 1;
const MAX_ZOOM = 300;
// Al enfocar una región el zoom se calcula para que sus AZ ocupen buena parte del mapa, entre estos límites
const FOCUS_MIN_ZOOM = 6;
const FOCUS_MAX_ZOOM = 160;

// Pares de regiones conectadas con arcos en el mapa
const MAP_ARCS: [string, string][] = [
  ['us-east-1', 'us-west-2'],
  ['us-east-1', 'sa-east-1'],
  ['us-east-1', 'eu-west-1'],
  ['eu-west-1', 'eu-central-1'],
  ['eu-central-1', 'ap-southeast-1'],
  ['us-west-2', 'ap-southeast-1'],
];

// Respeta "reducir movimiento" del sistema (las animaciones SMIL no lo hacen solas)
const reduceMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const EMPTY_PLANNING: RegionPlanning = { plans: 0, services: [], monthly: 0 };

export default function Infraestructura() {
  const { regions, regionId, setRegionId } = useRegion();
  const mapMarkers = useMemo(
    () => regions.map((r) => ({ id: r.id, name: r.name, location: r.location, ...geoToMapXY(r.lat, r.lon) })),
    [regions]
  );
  // Datos reales: planificaciones guardadas en el backend (Supabase), agrupadas por región
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProposals(await fetchProposals());
    } catch (e) {
      setProposals([]);
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const planning = useMemo(() => planningByRegion(proposals), [proposals]);
  const planOf = (id: string): RegionPlanning => planning[id] ?? EMPTY_PLANNING;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Región enfocada con zoom (muestra sus AZ) y si el cambio de vista debe animarse
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [smooth, setSmooth] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; panX: number; panY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  });

  const [landPaths, setLandPaths] = useState('');
  useEffect(() => {
    let cancelled = false;
    loadWorldLandPath().then((d) => {
      if (!cancelled) setLandPaths(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const zoomRef = useRef(1);
  const focusedRef = useRef<string | null>(null);
  const focusZoomRef = useRef(FOCUS_MIN_ZOOM);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  // Cambia el zoom. El desplazamiento se reduce proporcionalmente para que al volver a zoom 1
  // el mapa quede centrado; al alejar a la mitad del zoom de enfoque se sale del modo "región enfocada".
  const changeZoom = (target: number) => {
    const old = zoomRef.current;
    const next = clampZoom(target);
    if (next === old) return;
    zoomRef.current = next;
    setZoom(next);
    setPan((p) => (old > 1 ? { x: (p.x * (next - 1)) / (old - 1), y: (p.y * (next - 1)) / (old - 1) } : p));
    if (next < focusZoomRef.current / 2 && focusedRef.current) {
      focusedRef.current = null;
      setFocusedId(null);
    }
  };

  // Cuántas unidades del viewBox equivalen a 1px en pantalla (según el tamaño real renderizado del SVG)
  const pxToViewBoxUnits = () => {
    const el = svgRef.current;
    if (!el) return width / 800;
    const rect = el.getBoundingClientRect();
    // preserveAspectRatio por defecto es "xMidYMid meet": la escala real es la menor de las dos
    const scale = Math.min(rect.width / width, rect.height / height);
    return scale > 0 ? 1 / scale : width / 800;
  };

  // El wheel se engancha como listener nativo NO pasivo: React trata onWheel como
  // pasivo por defecto, así que un preventDefault() ahí no evita el scroll de la página.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      setSmooth(false);
      changeZoom(zoomRef.current * Math.exp(-e.deltaY * 0.0025));
    };
    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', onNativeWheel);
  }, []);

  // Acerca el mapa a una región: encuadra el pin de la región y todas sus AZ
  const focusRegion = (id: string) => {
    const region = regions.find((r) => r.id === id);
    if (!region) return;
    const pts = [geoToMapXY(region.lat, region.lon), ...region.azs.map((az) => geoToMapXY(az.lat, az.lon))];
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minPx = Math.min(...xs);
    const maxPx = Math.max(...xs);
    const minPy = Math.min(...ys);
    const maxPy = Math.max(...ys);
    const centerX = (minPx + maxPx) / 2;
    const centerY = (minPy + maxPy) / 2;

    // Zoom necesario para que el grupo ocupe ~45% del área visible del SVG
    const upp = pxToViewBoxUnits();
    const rect = svgRef.current?.getBoundingClientRect();
    const visW = (rect?.width ?? 800) * upp;
    const visH = (rect?.height ?? 360) * upp;
    const spanX = Math.max(maxPx - minPx, 1e-6);
    const spanY = Math.max(maxPy - minPy, 1e-6);
    const z = Math.min(FOCUS_MAX_ZOOM, Math.max(FOCUS_MIN_ZOOM, 0.45 * Math.min(visW / spanX, visH / spanY)));

    const cx = minX + width / 2;
    const cy = minY + height / 2;
    setSmooth(true);
    zoomRef.current = z;
    focusZoomRef.current = z;
    setZoom(z);
    setPan({ x: -z * (centerX - cx), y: -z * (centerY - cy) });
    focusedRef.current = id;
    setFocusedId(id);
    setRegionId(id);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setSmooth(false);
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState.current.dragging) return;
    const unitsPerPx = pxToViewBoxUnits();
    const dx = (e.clientX - dragState.current.startX) * unitsPerPx;
    const dy = (e.clientY - dragState.current.startY) * unitsPerPx;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  };

  const handlePointerUp = () => {
    dragState.current.dragging = false;
  };

  const resetView = () => {
    setSmooth(true);
    zoomRef.current = 1;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    focusedRef.current = null;
    setFocusedId(null);
  };

  const focusedRegion = focusedId ? regions.find((r) => r.id === focusedId) : undefined;
  const totalAzs = regions.reduce((sum, r) => sum + r.azs.length, 0);
  const operational = regions.filter((r) => r.status === 'operational').length;
  const review = regions.filter((r) => r.status === 'review').length;
  const totalServices = new Set(Object.values(planning).flatMap((p) => p.services)).size;
  const totalPlans = proposals.filter((p) => p.regionId).length;

  const getRegionStatus = (id: string) =>
    regions.find((r) => r.id === id)?.status ?? 'operational';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Infraestructura Global</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Vista global de regiones y servicios planificados en la infraestructura Cloud
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-md bg-card border border-border text-xs text-text-main hover:border-primary transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 text-[#DC2626] rounded-xl p-4 text-sm">
          No se pudieron cargar las planificaciones: {error}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Regiones', value: regions.length, icon: Globe2 },
          { label: 'Zonas de disponibilidad', value: totalAzs, icon: Layers },
          { label: 'Planificaciones', value: totalPlans, icon: ClipboardList },
          { label: 'Servicios planificados', value: totalServices, icon: Server },
          { label: 'Regiones operativas', value: operational, icon: CheckCircle2 },
          { label: 'Requieren revisión', value: review, icon: AlertTriangle },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-4">
              <Icon className="w-4 h-4 text-[#2563EB] mb-2" />
              <p className="text-2xl font-semibold text-text-main">{kpi.value}</p>
              <p className="text-xs text-text-secondary">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Map LEFT + Regions RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* World Map - Left */}
        <div className="lg:col-span-3 bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-main">Mapa mundial</h2>
            <div className="flex items-center gap-3 text-[11px] text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Operativo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                Revisión
              </span>
            </div>
          </div>

          <div className="relative w-full h-[280px] sm:h-[320px] lg:h-[360px] rounded-lg overflow-hidden bg-[#061024] border border-[#1E293B]">
            {/* Zoom controls */}
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setSmooth(true);
                  changeZoom(zoomRef.current * 1.4);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 hover:bg-white text-[#1E293B] shadow-sm border border-[#E2E8F0]"
                aria-label="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSmooth(true);
                  changeZoom(zoomRef.current / 1.4);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 hover:bg-white text-[#1E293B] shadow-sm border border-[#E2E8F0]"
                aria-label="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 hover:bg-white text-[#1E293B] shadow-sm border border-[#E2E8F0]"
                aria-label="Restablecer vista"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <svg
              ref={svgRef}
              viewBox={VIEWBOX}
              className="w-full h-full absolute inset-0 touch-none select-none"
              style={{ cursor: 'grab' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <defs>
                <radialGradient id="oceanGlow" cx="50%" cy="42%" r="75%">
                  <stop offset="0%" stopColor="#0E2340" />
                  <stop offset="60%" stopColor="#081833" />
                  <stop offset="100%" stopColor="#040B1A" />
                </radialGradient>
                <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82A0" />
                  <stop offset="100%" stopColor="#1E4D5C" />
                </linearGradient>
              </defs>

              <rect x={minX} y={minY} width={width} height={height} fill="url(#oceanGlow)" />

              <g
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: `${minX + width / 2}px ${minY + height / 2}px`,
                  transition: dragState.current.dragging
                    ? 'none'
                    : smooth
                      ? 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
                      : 'transform 0.05s linear',
                }}
              >
                {/* Países (world-atlas / Natural Earth). El trazo no escala con el zoom */}
                <g
                  className="[&_path]:[vector-effect:non-scaling-stroke]"
                  fill="url(#landGradient)"
                  stroke="#0B2A38"
                  strokeWidth="0.6"
                  dangerouslySetInnerHTML={{ __html: landPaths }}
                />

                {/* Vista global: arcos, marcadores y etiquetas de cada región */}
                {!focusedId && (
                  <>
                    {MAP_ARCS.map(([idA, idB]) => [
                      mapMarkers.find((mk) => mk.id === idA),
                      mapMarkers.find((mk) => mk.id === idB),
                    ])
                      .filter((pair): pair is [(typeof mapMarkers)[number], (typeof mapMarkers)[number]] => !!pair[0] && !!pair[1])
                      .map(([a, b], i) => {
                        const midX = (a.x + b.x) / 2;
                        const midY = (a.y + b.y) / 2 - height * 0.06;
                        const d = `M${a.x},${a.y} Q${midX},${midY} ${b.x},${b.y}`;
                        const dash = width * 0.004;
                        const gap = width * 0.003;
                        const dur = 3 + (i % 3) * 0.7;
                        return (
                          <g key={i} style={{ pointerEvents: 'none' }}>
                            {/* Línea de guiones que fluye de A hacia B */}
                            <path
                              d={d}
                              fill="none"
                              stroke="#38BDF8"
                              strokeWidth={width * 0.0011}
                              strokeDasharray={`${dash} ${gap}`}
                              opacity="0.65"
                            >
                              {!reduceMotion && (
                                <animate
                                  attributeName="stroke-dashoffset"
                                  from="0"
                                  to={`${-(dash + gap)}`}
                                  dur="0.9s"
                                  repeatCount="indefinite"
                                />
                              )}
                            </path>
                            {/* Paquete de datos que recorre el arco */}
                            {!reduceMotion && (
                              <>
                                <circle r={width * 0.0065} fill="#38BDF8" opacity="0.25">
                                  <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} begin={`${i * 0.4}s`} />
                                </circle>
                                <circle r={width * 0.0028} fill="#E0F2FE">
                                  <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} begin={`${i * 0.4}s`} />
                                </circle>
                              </>
                            )}
                          </g>
                        );
                      })}

                    {/* Marcadores con pulso */}
                    {mapMarkers.map((m) => {
                      const status = getRegionStatus(m.id);
                      const cfg = statusConfig[status];
                      const r = width * 0.006;
                      return (
                        <g
                          key={m.id}
                          onClick={() => focusRegion(m.id)}
                          style={{ cursor: 'pointer' }}
                          role="button"
                          aria-label={`Seleccionar región ${m.name} ${m.location}`}
                        >
                          {m.id === regionId && (
                            <circle cx={m.x} cy={m.y} r={r * 3.4} fill="none" stroke="#FFFFFF" strokeWidth={width * 0.0016} />
                          )}
                          <circle cx={m.x} cy={m.y} r={r * 2.5} fill={cfg.pin} opacity="0.15">
                            <animate attributeName="r" values={`${r * 1.8};${r * 3.2};${r * 1.8}`} dur="2.4s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2.4s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={m.x} cy={m.y} r={r * 1.3} fill={cfg.pin} opacity="0.5" />
                          <circle cx={m.x} cy={m.y} r={r} fill={cfg.pin} stroke="white" strokeWidth={width * 0.0009} />
                        </g>
                      );
                    })}

                    {/* Etiquetas (dentro del SVG para que se muevan con el mapa) */}
                    {mapMarkers.map((m) => {
                      const azCount = regions.find((r) => r.id === m.id)?.azs.length ?? 0;
                      const k = 1 / Math.sqrt(zoom);
                      return (
                        <g key={`label-${m.id}`} style={{ pointerEvents: 'none' }}>
                          <text
                            x={m.x}
                            y={m.y + width * 0.02 * k}
                            textAnchor="middle"
                            fontSize={width * 0.011 * k}
                            fontWeight="700"
                            fill="#7DD3FC"
                            style={{ paintOrder: 'stroke', stroke: '#040B1A', strokeWidth: width * 0.0035 * k }}
                          >
                            {`${azCount} AZ`}
                          </text>
                          <text
                            x={m.x}
                            y={m.y - width * 0.018 * k}
                            textAnchor="middle"
                            fontSize={width * 0.017 * k}
                            fontWeight="700"
                            fill="#F8FAFC"
                            style={{ paintOrder: 'stroke', stroke: '#040B1A', strokeWidth: width * 0.004 * k }}
                          >
                            {m.name}
                          </text>
                          <text
                            x={m.x}
                            y={m.y - width * 0.003 * k}
                            textAnchor="middle"
                            fontSize={width * 0.013 * k}
                            fill="#93C5FD"
                            style={{ paintOrder: 'stroke', stroke: '#040B1A', strokeWidth: width * 0.0035 * k }}
                          >
                            {m.location}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Región enfocada: se ocultan las demás; se dibuja el pin de la región, sus AZ y las líneas que los unen */}
                {focusedRegion && (
                  <g style={{ pointerEvents: 'none' }}>
                    {(() => {
                      // Tamaños inversamente proporcionales al zoom: se ven igual de grandes en pantalla
                      const u = (width * 0.012) / zoom;
                      const center = geoToMapXY(focusedRegion.lat, focusedRegion.lon);
                      const pin = statusConfig[focusedRegion.status].pin;
                      const azPoints = focusedRegion.azs.map((az) => ({ az, ...geoToMapXY(az.lat, az.lon) }));
                      return (
                        <>
                          {azPoints.map(({ az, x, y }) => (
                            <line
                              key={`line-${az.id}`}
                              x1={center.x}
                              y1={center.y}
                              x2={x}
                              y2={y}
                              stroke="#38BDF8"
                              strokeWidth={u * 0.22}
                              strokeDasharray={`${u * 0.9} ${u * 0.6}`}
                              opacity="0.85"
                            >
                              {!reduceMotion && (
                                <animate
                                  attributeName="stroke-dashoffset"
                                  from="0"
                                  to={`${-(u * 1.5)}`}
                                  dur="1.2s"
                                  repeatCount="indefinite"
                                />
                              )}
                            </line>
                          ))}
                          <circle cx={center.x} cy={center.y} r={u * 1.1} fill={pin} stroke="white" strokeWidth={u * 0.2}>
                            <animate attributeName="r" values={`${u * 1.1};${u * 1.4};${u * 1.1}`} dur="2.4s" repeatCount="indefinite" />
                          </circle>
                          {azPoints.map(({ az, x, y }) => (
                            <g key={az.id}>
                              <circle cx={x} cy={y} r={u * 1.9} fill="#0EA5E9" opacity="0.2">
                                <animate attributeName="r" values={`${u * 1.3};${u * 2.3};${u * 1.3}`} dur="2.4s" repeatCount="indefinite" />
                              </circle>
                              <circle cx={x} cy={y} r={u} fill="#0EA5E9" stroke="white" strokeWidth={u * 0.18} />
                              <text x={x} y={y + u * 0.42} textAnchor="middle" fontSize={u * 1.2} fontWeight="700" fill="white">
                                {az.letter}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </g>
                )}
              </g>
            </svg>

            {/* Tarjeta con el resumen de la región enfocada (HTML fijo en la esquina, no escala con el zoom) */}
            {focusedRegion && (
              <div className="absolute top-2 left-2 z-10 w-[210px] max-h-[calc(100%-16px)] overflow-y-auto rounded-lg bg-[#0B1730]/95 border border-[#1E3A5F] p-2.5 shadow-lg text-[#E2E8F0]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold leading-tight truncate">
                      {focusedRegion.name} · {focusedRegion.location}
                    </p>
                    <p className="text-[10px] text-[#7DD3FC]">{focusedRegion.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetView}
                    className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[#94A3B8]"
                    aria-label="Cerrar y volver a la vista global"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: statusConfig[focusedRegion.status].pin }}
                  />
                  <span>{statusConfig[focusedRegion.status].label}</span>
                  <span className="text-[#64748B]">·</span>
                  <span>{planOf(focusedRegion.id).services.length} servicios</span>
                  <span className="text-[#64748B]">·</span>
                  <span>{planOf(focusedRegion.id).plans} plan.</span>
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  {focusedRegion.azs.length} zonas de disponibilidad
                </p>
                <ul className="mt-1 space-y-1">
                  {focusedRegion.azs.map((az) => (
                    <li key={az.id} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-4 h-4 shrink-0 rounded-full bg-[#0EA5E9] text-white text-[9px] font-bold flex items-center justify-center">
                        {az.letter}
                      </span>
                      <span className="font-medium">{az.id}</span>
                      <span className="text-[#94A3B8] truncate">{az.city}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="absolute bottom-1.5 left-2 text-[9px] text-text-secondary">
              Arrastra para mover · rueda del mouse para zoom
            </p>
          </div>
        </div>

        {/* Regions list - Right */}
        <div className="lg:col-span-2 flex flex-col min-w-0 bg-card rounded-xl border border-border p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-main">Regiones y servidores</h2>
            <span className="text-[11px] text-text-secondary">{regions.length} regiones</span>
          </div>
          {/* p-1 deja espacio para que el aro de la región actual no se corte con el scroll */}
          <div className="space-y-2.5 p-1 lg:overflow-y-auto lg:h-[360px]">
            {regions.map((region) => {
              const cfg = statusConfig[region.status];
              const plan = planOf(region.id);
              const isCurrent = region.id === regionId;
              return (
                <div
                  key={region.id}
                  className={`rounded-xl border p-3.5 ${cfg.bg} ${cfg.border} ${isCurrent ? 'ring-2 ring-[#2563EB]' : ''}`}
                >
                  {/* Encabezado: nombre + estado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${cfg.color}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-main truncate">{region.name}</p>
                        <p className="text-[11px] text-text-secondary truncate">
                          {region.location} · {region.id}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {/* Servicios planificados */}
                  <div className="flex flex-wrap items-center gap-1 mt-3 min-h-[22px]">
                    {plan.services.map((svc) => (
                      <span
                        key={svc}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-card text-text-main border border-border"
                      >
                        <Server className="w-2.5 h-2.5 text-[#2563EB]" />
                        {svc}
                      </span>
                    ))}
                    {plan.services.length === 0 && (
                      <span className="text-[11px] text-text-secondary">Sin planificaciones</span>
                    )}
                  </div>

                  {/* Pie: resumen + acción, siempre en la misma posición */}
                  <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-black/5 dark:border-white/10">
                    <p className="text-[11px] text-text-secondary min-w-0 truncate">
                      {plan.plans > 0 ? (
                        <>
                          {plan.plans} {plan.plans === 1 ? 'planificación' : 'planificaciones'} ·{' '}
                          <span className="font-semibold text-text-main">{usd(plan.monthly)}/mes</span>
                        </>
                      ) : (
                        <>{region.azs.length} zonas de disponibilidad</>
                      )}
                    </p>
                    {isCurrent ? (
                      <span className="shrink-0 whitespace-nowrap text-[10px] font-semibold text-[#2563EB]">
                        Región actual
                      </span>
                    ) : (
                      <button
                        onClick={() => focusRegion(region.id)}
                        className="shrink-0 whitespace-nowrap text-[10px] font-medium px-2.5 py-1 rounded-md bg-[#2563EB] text-white hover:bg-blue-700 transition-colors"
                      >
                        Seleccionar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed region cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {regions.map((region) => {
          const cfg = statusConfig[region.status];
          return (
            <div key={region.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-main">{region.name}</h3>
                  <p className="text-xs text-text-secondary">
                    {region.location} · {region.id}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-xs font-medium text-text-secondary mb-2">
                  Zonas de disponibilidad ({region.azs.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {region.azs.map((az) => (
                    <span
                      key={az.id}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30"
                    >
                      {az.id}
                      {az.city && <span className="text-text-secondary"> · {az.city}</span>}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-medium text-text-secondary">Servicios planificados</p>
                  <p className="text-[11px] text-text-secondary">
                    {planOf(region.id).plans} {planOf(region.id).plans === 1 ? 'planificación' : 'planificaciones'}
                    {planOf(region.id).plans > 0 && (
                      <>
                        {' '}· <span className="font-medium text-text-main">{usd(planOf(region.id).monthly)}/mes</span>
                      </>
                    )}
                  </p>
                </div>
                {planOf(region.id).services.length === 0 ? (
                  <p className="text-xs text-text-secondary">Esta región aún no tiene planificaciones.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {planOf(region.id).services.map((svc) => (
                      <div
                        key={svc}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-border text-sm"
                      >
                        <Server className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span className="font-medium text-text-main">{svc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}