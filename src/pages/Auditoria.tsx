import { useCallback, useEffect, useState } from 'react';
import { MapPin, LocateFixed, Search, Loader2, AlertTriangle, ShieldCheck, Hand } from 'lucide-react';
import LocationMap from '../components/auditoria/LocationMap';
import {
  GeoError,
  getDevicePosition,
  reverseGeocode,
  searchAddress,
  type AddressResult,
  type Place,
} from '../utils/geolocation';

interface AuditPosition {
  lat: number;
  lon: number;
  /** Precisión en metros; null en ubicaciones manuales */
  accuracy: number | null;
  timestamp: number;
  source: 'gps' | 'manual';
}

type GpsState = 'locating' | 'ready' | 'error';
type PlaceState = 'idle' | 'loading' | 'ready' | 'error';

export default function Auditoria() {
  const [position, setPosition] = useState<AuditPosition | null>(null);
  const [gpsState, setGpsState] = useState<GpsState>('locating');
  const [gpsError, setGpsError] = useState<GeoError | null>(null);

  const [place, setPlace] = useState<Place | null>(null);
  const [placeState, setPlaceState] = useState<PlaceState>('idle');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const locate = useCallback(() => {
    setGpsState('locating');
    setGpsError(null);
    getDevicePosition()
      .then((p) => {
        setPosition({ ...p, source: 'gps' });
        setGpsState('ready');
      })
      .catch((err: unknown) => {
        setGpsError(err instanceof GeoError ? err : new GeoError('unavailable', 'No se pudo obtener la ubicación.'));
        setGpsState('error');
      });
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  // Distrito y dirección a partir de las coordenadas actuales
  useEffect(() => {
    if (!position) return;
    const controller = new AbortController();
    setPlaceState('loading');
    reverseGeocode(position.lat, position.lon, controller.signal)
      .then((p) => {
        setPlace(p);
        setPlaceState('ready');
      })
      .catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return;
        setPlace(null);
        setPlaceState('error');
      });
    return () => controller.abort();
  }, [position]);

  const pickManually = (lat: number, lon: number) => {
    setPosition({ lat, lon, accuracy: null, timestamp: Date.now(), source: 'manual' });
  };

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const found = await searchAddress(q);
      setResults(found);
      if (found.length === 0) setSearchError('No se encontraron resultados para esa dirección.');
    } catch {
      setResults([]);
      setSearchError('No se pudo buscar la dirección. Intenta de nuevo en unos segundos.');
    } finally {
      setSearching(false);
    }
  };

  const isGps = position?.source === 'gps';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-main">Auditoría</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Ubicación desde donde se accede al sistema: coordenadas GPS, distrito y dirección
        </p>
      </div>

      {gpsState === 'error' && gpsError && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
          <div className="text-sm text-text-main space-y-2">
            <p className="font-semibold">{gpsError.message}</p>
            {gpsError.code === 'denied' && (
              <p className="text-text-secondary">
                Para activarlo: toca el candado de la barra de direcciones → Ubicación → Permitir, y pulsa
                «Reintentar». Si tu dispositivo no te deja activarlo, ubica el punto manualmente con el buscador o
                haciendo click en el mapa.
              </p>
            )}
            {gpsError.code !== 'denied' && (
              <p className="text-text-secondary">
                Puedes reintentar o ubicar el punto manualmente con el buscador o haciendo click en el mapa.
              </p>
            )}
            <button
              type="button"
              onClick={locate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-medium hover:bg-blue-700"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-main">Mapa</h2>
            <span className="text-[11px] text-text-secondary">Haz click en el mapa para ubicar un punto manualmente</span>
          </div>
          <div className="relative w-full h-[320px] sm:h-[400px] rounded-lg overflow-hidden border border-border z-0">
            <LocationMap position={position} onPick={pickManually} />
            {gpsState === 'locating' && !position && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/30 text-white text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Obteniendo ubicación…
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-main">Ubicación actual</h2>
              {position && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    isGps
                      ? 'bg-green-50 dark:bg-green-500/10 text-[#16A34A] border-green-200 dark:border-green-500/30'
                      : 'bg-amber-50 dark:bg-amber-500/10 text-[#F59E0B] border-amber-200 dark:border-amber-500/30'
                  }`}
                >
                  {isGps ? <ShieldCheck className="w-3 h-3" /> : <Hand className="w-3 h-3" />}
                  {isGps ? 'GPS del dispositivo' : 'Manual, no verificada por GPS'}
                </span>
              )}
            </div>

            {!position ? (
              <p className="text-sm text-text-secondary">
                {gpsState === 'locating' ? 'Esperando la ubicación del dispositivo…' : 'Aún no hay una ubicación.'}
              </p>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] text-text-secondary">Distrito</dt>
                  <dd className="text-base font-semibold text-text-main">
                    {placeState === 'loading' && <span className="text-text-secondary text-sm">Consultando…</span>}
                    {placeState === 'error' && <span className="text-text-secondary text-sm">No disponible</span>}
                    {placeState === 'ready' && (place?.district ?? <span className="text-text-secondary text-sm">No identificado</span>)}
                  </dd>
                  {placeState === 'ready' && place?.area && (
                    <dd className="text-[11px] text-text-secondary">{place.area}</dd>
                  )}
                </div>
                <div>
                  <dt className="text-[11px] text-text-secondary">Dirección</dt>
                  <dd className="text-text-main">
                    {placeState === 'ready'
                      ? (place?.address ?? <span className="text-text-secondary">No disponible para este punto (solo distrito)</span>)
                      : <span className="text-text-secondary">—</span>}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-[11px] text-text-secondary">Latitud</dt>
                    <dd className="font-mono text-text-main">{position.lat.toFixed(6)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-text-secondary">Longitud</dt>
                    <dd className="font-mono text-text-main">{position.lon.toFixed(6)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-text-secondary">Precisión</dt>
                    <dd className="text-text-main">
                      {position.accuracy != null ? `± ${Math.round(position.accuracy)} m` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-text-secondary">Registrada</dt>
                    <dd className="text-text-main">{new Date(position.timestamp).toLocaleString('es-PE')}</dd>
                  </div>
                </div>
              </dl>
            )}

            <button
              type="button"
              onClick={locate}
              disabled={gpsState === 'locating'}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-text-main hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-60"
            >
              {gpsState === 'locating' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
              Actualizar con GPS
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold text-text-main mb-1">Ubicar manualmente</h2>
            <p className="text-[11px] text-text-secondary mb-3">
              Úsalo si el GPS no está disponible. La ubicación quedará marcada como no verificada.
            </p>
            <form onSubmit={runSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Dirección, distrito o lugar"
                className="flex-1 min-w-0 px-3 py-1.5 rounded-md border border-border bg-transparent text-sm text-text-main placeholder:text-text-secondary"
              />
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2563EB] text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Buscar
              </button>
            </form>
            {searchError && <p className="mt-2 text-xs text-[#DC2626]">{searchError}</p>}
            {results.length > 0 && (
              <ul className="mt-2 space-y-1">
                {results.map((r) => (
                  <li key={`${r.lat},${r.lon}`}>
                    <button
                      type="button"
                      onClick={() => {
                        pickManually(r.lat, r.lon);
                        setResults([]);
                      }}
                      className="w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs text-text-main"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{r.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
