import { useCallback, useState } from 'react';
import {
  MapPin,
  Navigation,
  Building2,
  Map,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Clock,
  Globe2,
  Search,
  Wifi,
  Info,
} from 'lucide-react';

interface GeoPosition {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  source: 'manual' | 'ip' | 'gps';
}

interface AddressInfo {
  formatted: string;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postcode: string | null;
  road: string | null;
  suburb: string | null;
  neighbourhood: string | null;
  /** Campos extra útiles (p. ej. Perú) */
  extras: { label: string; value: string }[];
  raw: Record<string, string>;
}

type Status = 'idle' | 'locating' | 'geocoding' | 'success' | 'error';

function pickDistrict(addr: Record<string, string>): string | null {
  // Orden pensado para LatAm / Perú (distrito, barrio) y Europa
  return (
    addr.city_district ||
    addr.district ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.borough ||
    addr.city_block ||
    addr.residential ||
    // En algunos países Nominatim usa county a nivel local
    (addr.county && addr.county !== addr.state && addr.county !== addr.region ? addr.county : null) ||
    addr.municipality ||
    null
  );
}

async function reverseGeocode(lat: number, lon: number): Promise<AddressInfo> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'es');
  // zoom 18 = máximo detalle (calle); si solo hay ciudad, Nominatim igual devuelve lo que haya
  url.searchParams.set('zoom', '18');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Error al consultar dirección (${res.status}). Espera unos segundos e inténtalo de nuevo.`);
  }

  const data = await res.json();
  if (!data || data.error) {
    throw new Error(data?.error ?? 'No se encontró dirección para esas coordenadas');
  }

  const addr = (data.address ?? {}) as Record<string, string>;
  const district = pickDistrict(addr);

  // Campos adicionales que a veces aportan contexto (sin duplicar lo ya mostrado)
  const used = new Set(
    [
      district,
      addr.city,
      addr.town,
      addr.village,
      addr.state,
      addr.region,
      addr.country,
      addr.postcode,
      addr.road,
      addr.pedestrian,
    ].filter(Boolean)
  );

  const extraKeys: { key: string; label: string }[] = [
    { key: 'suburb', label: 'Suburbio / zona' },
    { key: 'neighbourhood', label: 'Barrio' },
    { key: 'quarter', label: 'Cuartel / zona' },
    { key: 'city_district', label: 'Distrito urbano' },
    { key: 'county', label: 'Condado / provincia local' },
    { key: 'municipality', label: 'Municipalidad' },
    { key: 'hamlet', label: 'Caserío' },
    { key: 'historic', label: 'Lugar histórico' },
  ];

  const extras = extraKeys
    .filter(({ key }) => addr[key] && !used.has(addr[key]))
    .map(({ key, label }) => ({ label, value: addr[key] }));

  return {
    formatted: data.display_name ?? 'Dirección no disponible',
    district,
    city: addr.city || addr.town || addr.village || addr.municipality || null,
    state: addr.state || addr.region || null,
    country: addr.country || null,
    postcode: addr.postcode || null,
    road: addr.road || addr.pedestrian || null,
    suburb: addr.suburb || null,
    neighbourhood: addr.neighbourhood || null,
    extras,
    raw: addr,
  };
}

async function getPositionByIp(): Promise<GeoPosition> {
  const res = await fetch('https://ipapi.co/json/');
  if (!res.ok) throw new Error('No se pudo obtener ubicación por IP');
  const data = await res.json();
  if (data.error || data.latitude == null || data.longitude == null) {
    throw new Error(data.reason || 'Respuesta de IP incompleta');
  }
  return {
    lat: Number(data.latitude),
    lon: Number(data.longitude),
    accuracy: 5000,
    timestamp: Date.now(),
    source: 'ip',
  };
}

function tryGps(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no disponible'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
          source: 'gps',
        });
      },
      (err) => reject(new Error(err.message || 'GPS no disponible')),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

const SOURCE_LABEL: Record<GeoPosition['source'], string> = {
  manual: 'Manual',
  ip: 'IP (aproximada · ciudad)',
  gps: 'GPS del dispositivo',
};

/** Coordenadas de referencia de distritos de Lima (centro aproximado) para ayuda al usuario */
const LIMA_DISTRITOS: { name: string; lat: number; lon: number }[] = [
  { name: 'Miraflores', lat: -12.1211, lon: -77.0297 },
  { name: 'San Isidro', lat: -12.0970, lon: -77.0350 },
  { name: 'Barranco', lat: -12.1440, lon: -77.0205 },
  { name: 'Surco', lat: -12.1450, lon: -76.9920 },
  { name: 'La Molina', lat: -12.0780, lon: -76.9440 },
  { name: 'San Borja', lat: -12.1080, lon: -76.9980 },
  { name: 'Jesús María', lat: -12.0785, lon: -77.0480 },
  { name: 'Lince', lat: -12.0860, lon: -77.0365 },
  { name: 'Pueblo Libre', lat: -12.0760, lon: -77.0620 },
  { name: 'Magdalena del Mar', lat: -12.0920, lon: -77.0700 },
  { name: 'Cercado de Lima', lat: -12.0464, lon: -77.0428 },
  { name: 'Breña', lat: -12.0580, lon: -77.0500 },
];

export default function Auditoria() {
  const [status, setStatus] = useState<Status>('idle');
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [address, setAddress] = useState<AddressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<
    { position: GeoPosition; address: AddressInfo; at: string }[]
  >([]);

  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  const resolveAddress = useCallback(async (pos: GeoPosition) => {
    setPosition(pos);
    setStatus('geocoding');
    setError(null);
    setAddress(null);

    try {
      const addr = await reverseGeocode(pos.lat, pos.lon);
      setAddress(addr);
      setStatus('success');
      setHistory((prev) =>
        [
          {
            position: pos,
            address: addr,
            at: new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'medium' }),
          },
          ...prev,
        ].slice(0, 10)
      );
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Error al obtener la dirección');
    }
  }, []);

  const handleManual = async () => {
    const lat = parseFloat(manualLat.replace(',', '.'));
    const lon = parseFloat(manualLon.replace(',', '.'));
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError('Introduce latitud y longitud válidas (ej. -12.1211 y -77.0297)');
      setStatus('error');
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Rango inválido: lat −90…90, lon −180…180');
      setStatus('error');
      return;
    }
    await resolveAddress({
      lat,
      lon,
      accuracy: 50,
      timestamp: Date.now(),
      source: 'manual',
    });
  };

  const handleByIp = async () => {
    setStatus('locating');
    setError(null);
    setAddress(null);
    try {
      const pos = await getPositionByIp();
      setManualLat(pos.lat.toFixed(6));
      setManualLon(pos.lon.toFixed(6));
      await resolveAddress(pos);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'No se pudo obtener ubicación por IP');
    }
  };

  const handleGps = async () => {
    setStatus('locating');
    setError(null);
    setAddress(null);
    try {
      const pos = await tryGps();
      setManualLat(pos.lat.toFixed(6));
      setManualLon(pos.lon.toFixed(6));
      await resolveAddress(pos);
    } catch (e) {
      setStatus('error');
      setError(
        (e instanceof Error ? e.message : 'GPS no disponible') +
          '. Usa coordenadas manuales o un distrito de la lista.'
      );
    }
  };

  const applyDistrito = (d: { name: string; lat: number; lon: number }) => {
    setManualLat(d.lat.toFixed(6));
    setManualLon(d.lon.toFixed(6));
  };

  const accuracyLabel =
    position &&
    (position.accuracy < 30
      ? 'Alta precisión'
      : position.accuracy < 100
        ? 'Precisión media'
        : position.source === 'ip'
          ? 'Solo ciudad (IP)'
          : 'Baja precisión');

  const isLima =
    address &&
    (address.city?.toLowerCase().includes('lima') ||
      address.state?.toLowerCase().includes('lima') ||
      address.formatted.toLowerCase().includes('lima'));

  const missingDistrict = address && !address.district;
  const missingRoad = address && !address.road;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Auditoría de ubicación</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Distrito y dirección reales a partir de coordenadas (sin necesidad de GPS del dispositivo)
          </p>
        </div>
      </div>

      {/* Entrada */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-main flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Cómo obtener la ubicación
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-1">
              Latitud
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="-12.121100"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-main font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-1">
              Longitud
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="-77.029700"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-main font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={handleManual}
            disabled={status === 'locating' || status === 'geocoding'}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {status === 'geocoding' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            Buscar dirección
          </button>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleByIp}
              disabled={status === 'locating' || status === 'geocoding'}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-text-main hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-60 transition-colors"
            >
              <Wifi className="w-4 h-4" />
              Por IP
            </button>
            <button
              onClick={handleGps}
              disabled={status === 'locating' || status === 'geocoding'}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-text-main hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-60 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              GPS
            </button>
          </div>
        </div>

        {/* Atajos Lima */}
        <div>
          <p className="text-[11px] text-text-secondary mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            La IP solo da la ciudad. Para ver <strong>distrito y dirección</strong> en Lima, elige uno:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LIMA_DISTRITOS.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => applyDistrito(d)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-border text-text-secondary hover:border-primary hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
              >
                {d.name}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-secondary mt-1.5">
            Al pulsar un distrito se rellenan las coordenadas; luego pulsa <strong>Buscar dirección</strong>.
          </p>
        </div>
      </div>

      {status === 'locating' && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-sm text-primary">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          Obteniendo coordenadas…
        </div>
      )}
      {status === 'geocoding' && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-sm text-primary">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          Consultando dirección real (OpenStreetMap)…
        </div>
      )}
      {status === 'error' && error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-sm text-[#DC2626]">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">No se pudo completar</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Aviso IP sin distrito */}
      {status === 'success' && position?.source === 'ip' && (missingDistrict || missingRoad) && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-sm text-[#B45309] dark:text-amber-200">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Ubicación por IP: solo a nivel de ciudad</p>
            <p className="mt-0.5 opacity-90">
              Se detectó correctamente <strong>{address?.city ?? 'la ciudad'}</strong>
              {address?.country ? ` (${address.country})` : ''}, pero la IP no tiene precisión de
              distrito ni de calle. Elige un distrito en la lista de arriba o escribe coordenadas más
              exactas y pulsa <strong>Buscar dirección</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coordenadas */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Crosshair className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-main">Coordenadas</h2>
              <p className="text-[11px] text-text-secondary">
                {position ? `Origen: ${SOURCE_LABEL[position.source]}` : 'Sin datos'}
              </p>
            </div>
          </div>

          {position ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">Latitud</p>
                  <p className="text-sm font-mono font-medium text-text-main">{position.lat.toFixed(6)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-0.5">Longitud</p>
                  <p className="text-sm font-mono font-medium text-text-main">{position.lon.toFixed(6)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Precisión: ±{Math.round(position.accuracy)} m</span>
                {accuracyLabel && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      position.accuracy < 30
                        ? 'bg-green-50 dark:bg-green-500/10 text-[#16A34A]'
                        : position.accuracy < 500
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-[#F59E0B]'
                          : 'bg-slate-100 dark:bg-slate-800 text-text-secondary'
                    }`}
                  >
                    {accuracyLabel}
                  </span>
                )}
              </div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lon}#map=17/${position.lat}/${position.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Map className="w-3.5 h-3.5" />
                Ver en OpenStreetMap
              </a>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Introduce coordenadas o usa IP / GPS</p>
          )}
        </div>

        {/* Distrito */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-main">Distrito / Zona</h2>
              <p className="text-[11px] text-text-secondary">Datos reales (OpenStreetMap)</p>
            </div>
          </div>

          {address ? (
            <div className="space-y-3">
              <div
                className={`rounded-lg border px-4 py-3 ${
                  address.district
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-border'
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">
                  Distrito detectado
                </p>
                <p className="text-lg font-semibold text-text-main">
                  {address.district ?? 'No disponible con esta precisión'}
                </p>
              </div>
              <dl className="space-y-2 text-sm">
                {address.city && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-text-secondary">Ciudad</dt>
                    <dd className="font-medium text-text-main text-right">{address.city}</dd>
                  </div>
                )}
                {address.state && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-text-secondary">Provincia / Estado</dt>
                    <dd className="font-medium text-text-main text-right">{address.state}</dd>
                  </div>
                )}
                {address.country && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-text-secondary">País</dt>
                    <dd className="font-medium text-text-main text-right">{address.country}</dd>
                  </div>
                )}
                {address.postcode && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-text-secondary">Código postal</dt>
                    <dd className="font-medium text-text-main text-right">{address.postcode}</dd>
                  </div>
                )}
                {address.extras.map((ex) => (
                  <div key={ex.label} className="flex justify-between gap-2">
                    <dt className="text-text-secondary">{ex.label}</dt>
                    <dd className="font-medium text-text-main text-right">{ex.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              {status === 'geocoding' ? 'Resolviendo…' : 'Sin datos todavía'}
            </p>
          )}
        </div>

        {/* Dirección */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-main">Dirección</h2>
              <p className="text-[11px] text-text-secondary">Dirección completa si está disponible</p>
            </div>
          </div>

          {address ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                <p className="text-sm text-text-main leading-relaxed">{address.formatted}</p>
              </div>
              {address.road ? (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                  Calle: <span className="font-medium text-text-main">{address.road}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Sin calle exacta (coordenadas poco precisas o zona sin detalle en el mapa)
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              {status === 'geocoding' ? 'Resolviendo…' : 'Sin dirección todavía'}
            </p>
          )}
        </div>
      </div>

      {status === 'success' && position && address && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4.5 h-4.5 text-primary" />
            <h2 className="text-sm font-semibold text-text-main">Registro de auditoría</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-2.5 text-text-secondary w-40">Fecha / hora</td>
                  <td className="py-2.5 font-medium text-text-main">
                    {new Date(position.timestamp).toLocaleString('es-ES', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-text-secondary">Origen</td>
                  <td className="py-2.5 text-text-main">{SOURCE_LABEL[position.source]}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-text-secondary">Coordenadas</td>
                  <td className="py-2.5 font-mono text-text-main">
                    {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-text-secondary">Distrito</td>
                  <td className="py-2.5 font-medium text-text-main">
                    {address.district ?? '— (requiere coordenadas más precisas)'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-text-secondary">Dirección</td>
                  <td className="py-2.5 text-text-main">{address.formatted}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-text-secondary">Ciudad / País</td>
                  <td className="py-2.5 text-text-main">
                    {[address.city, address.state, address.country].filter(Boolean).join(', ')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4.5 h-4.5 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-main">
              Historial de esta sesión ({history.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-secondary">
                  <th className="pb-2 font-medium">Hora</th>
                  <th className="pb-2 font-medium">Origen</th>
                  <th className="pb-2 font-medium">Distrito</th>
                  <th className="pb-2 font-medium">Dirección</th>
                  <th className="pb-2 font-medium text-right">Coordenadas</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5 text-text-secondary whitespace-nowrap">{h.at}</td>
                    <td className="py-2.5 text-text-secondary text-xs">{SOURCE_LABEL[h.position.source]}</td>
                    <td className="py-2.5 font-medium text-text-main">
                      {h.address.district ?? h.address.city ?? '—'}
                    </td>
                    <td className="py-2.5 text-text-secondary max-w-xs truncate" title={h.address.formatted}>
                      {h.address.formatted}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-text-secondary whitespace-nowrap">
                      {h.position.lat.toFixed(5)}, {h.position.lon.toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-text-secondary leading-relaxed">
        <strong>Por IP</strong> solo se obtiene la ciudad (en tu caso Lima, Perú). Para distrito y
        calle hace falta más precisión: elige un distrito de la lista o introduce coordenadas
        exactas y pulsa <strong>Buscar dirección</strong>. Los datos salen de OpenStreetMap
        (Nominatim).
      </p>
    </div>
  );
}
