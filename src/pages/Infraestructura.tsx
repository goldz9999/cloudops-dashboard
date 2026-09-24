import { useRef, useState, useEffect, useMemo } from 'react';
import { Globe2, Server, CheckCircle2, AlertTriangle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useRegion } from '../context/useRegion';
import { WORLD_MAP_VIEWBOX, WORLD_MAP_PATHS, geoToMapXY } from '../data/worldMapData';

const statusConfig = {
  operational: {
    label: 'Operativo',
    color: 'bg-[#16A34A]',
    text: 'text-[#16A34A]',
    bg: 'bg-green-50',
    border: 'border-green-200',
    pin: '#22C55E',
  },
  review: {
    label: 'Requiere revisión',
    color: 'bg-[#F59E0B]',
    text: 'text-[#F59E0B]',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    pin: '#F59E0B',
  },
  issue: {
    label: 'Problema',
    color: 'bg-[#DC2626]',
    text: 'text-[#DC2626]',
    bg: 'bg-red-50',
    border: 'border-red-200',
    pin: '#EF4444',
  },
};

const { minX, minY, width, height } = WORLD_MAP_VIEWBOX;
const VIEWBOX = `${minX} ${minY} ${width} ${height}`;

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

// Pares de regiones conectadas con arcos en el mapa
const MAP_ARCS: [string, string][] = [
  ['us-east-1', 'us-west-2'],
  ['us-east-1', 'sa-east-1'],
  ['us-east-1', 'eu-west-1'],
  ['eu-west-1', 'eu-central-1'],
  ['eu-central-1', 'ap-southeast-1'],
  ['us-west-2', 'ap-southeast-1'],
];

export default function Infraestructura() {
  const { regions, regionId, setRegionId } = useRegion();
  const mapMarkers = useMemo(
    () => regions.map((r) => ({ id: r.id, name: r.name, location: r.location, ...geoToMapXY(r.lat, r.lon) })),
    [regions]
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; panX: number; panY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  });

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

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
      setZoom((z) => clampZoom(z - e.deltaY * 0.0025));
    };
    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', onNativeWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
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
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const operational = regions.filter((r) => r.status === 'operational').length;
  const review = regions.filter((r) => r.status === 'review').length;
  const totalServices = new Set(regions.flatMap((r) => r.services)).size;

  const getRegionStatus = (id: string) =>
    regions.find((r) => r.id === id)?.status ?? 'operational';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1E293B]">Infraestructura Global</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Vista global de regiones y servicios desplegados en la infraestructura Cloud
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Regiones', value: regions.length, icon: Globe2 },
          { label: 'Servicios desplegados', value: totalServices, icon: Server },
          { label: 'Regiones operativas', value: operational, icon: CheckCircle2 },
          { label: 'Requieren revisión', value: review, icon: AlertTriangle },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <Icon className="w-4 h-4 text-[#2563EB] mb-2" />
              <p className="text-2xl font-semibold text-[#1E293B]">{kpi.value}</p>
              <p className="text-xs text-[#64748B]">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Map LEFT + Regions RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* World Map - Left */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1E293B]">Mapa mundial</h2>
            <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
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
                onClick={() => setZoom((z) => clampZoom(z + 0.5))}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white/90 hover:bg-white text-[#1E293B] shadow-sm border border-[#E2E8F0]"
                aria-label="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => clampZoom(z - 0.5))}
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
                  transition: dragState.current.dragging ? 'none' : 'transform 0.05s linear',
                }}
              >
                {/* Silueta real de continentes (simple-world-map, CC BY-SA) */}
                <g
                  fill="url(#landGradient)"
                  stroke="#0B2A38"
                  strokeWidth="0.6"
                  dangerouslySetInnerHTML={{ __html: WORLD_MAP_PATHS }}
                />

                {/* Líneas de conexión entre regiones (arcos suaves) */}
                {MAP_ARCS.map(([idA, idB]) => [
                  mapMarkers.find((mk) => mk.id === idA),
                  mapMarkers.find((mk) => mk.id === idB),
                ])
                  .filter((pair): pair is [(typeof mapMarkers)[number], (typeof mapMarkers)[number]] => !!pair[0] && !!pair[1])
                  .map(([a, b], i) => {
                  const midX = (a.x + b.x) / 2;
                  const midY = (a.y + b.y) / 2 - height * 0.06;
                  return (
                    <path
                      key={i}
                      d={`M${a.x},${a.y} Q${midX},${midY} ${b.x},${b.y}`}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth={width * 0.0011}
                      strokeDasharray={`${width * 0.004} ${width * 0.003}`}
                      opacity="0.55"
                    />
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
                      onClick={() => setRegionId(m.id)}
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
                {mapMarkers.map((m) => (
                  <g key={`label-${m.id}`}>
                    <text
                      x={m.x}
                      y={m.y - width * 0.018}
                      textAnchor="middle"
                      fontSize={width * 0.017}
                      fontWeight="700"
                      fill="#F8FAFC"
                      style={{ paintOrder: 'stroke', stroke: '#040B1A', strokeWidth: width * 0.004 }}
                    >
                      {m.name}
                    </text>
                    <text
                      x={m.x}
                      y={m.y - width * 0.003}
                      textAnchor="middle"
                      fontSize={width * 0.013}
                      fill="#93C5FD"
                      style={{ paintOrder: 'stroke', stroke: '#040B1A', strokeWidth: width * 0.0035 }}
                    >
                      {m.location}
                    </text>
                  </g>
                ))}
              </g>
            </svg>

            <p className="absolute bottom-1.5 left-2 text-[9px] text-[#64748B]">
              Arrastra para mover · rueda del mouse para zoom
            </p>
          </div>
        </div>

        {/* Regions list - Right */}
        <div className="lg:col-span-2 flex flex-col">
          <h2 className="text-sm font-semibold text-[#1E293B] px-1 mb-3">Regiones y servidores</h2>
          <div className="space-y-3 lg:overflow-y-auto lg:pr-1 lg:h-[360px]">
          {regions.map((region) => {
            const cfg = statusConfig[region.status];
            return (
              <div
                key={region.id}
                className={`rounded-xl border p-3.5 ${cfg.bg} ${cfg.border} ${region.id === regionId ? 'ring-2 ring-[#2563EB]' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">{region.name}</p>
                      <p className="text-[11px] text-[#64748B]">{region.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    {region.id === regionId ? (
                      <span className="text-[10px] font-semibold text-[#2563EB]">Región actual</span>
                    ) : (
                      <button
                        onClick={() => setRegionId(region.id)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#2563EB] text-white hover:bg-blue-700"
                      >
                        Seleccionar
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {region.services.map((svc) => (
                    <span
                      key={svc}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-white text-[#1E293B] border border-[#E2E8F0]"
                    >
                      <Server className="w-2.5 h-2.5 text-[#2563EB]" />
                      {svc}
                    </span>
                  ))}
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
            <div key={region.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#1E293B]">{region.name}</h3>
                  <p className="text-xs text-[#64748B]">
                    {region.location} · {region.id}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#64748B]">Servicios activos</p>
                <div className="grid grid-cols-2 gap-2">
                  {region.services.map((svc) => (
                    <div
                      key={svc}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-[#E2E8F0] text-sm"
                    >
                      <Server className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="font-medium text-[#1E293B]">{svc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}