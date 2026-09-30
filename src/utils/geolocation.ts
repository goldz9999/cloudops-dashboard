// Ubicación del dispositivo (GPS del navegador) y conversión de coordenadas a distrito/dirección
// con OpenStreetMap (Nominatim). No se usa geolocalización por IP.

export type GeoErrorCode = 'unsupported' | 'insecure' | 'denied' | 'unavailable' | 'timeout';

export class GeoError extends Error {
  code: GeoErrorCode;
  constructor(code: GeoErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface DevicePosition {
  lat: number;
  lon: number;
  /** Precisión en metros */
  accuracy: number;
  timestamp: number;
}

const GEO_MESSAGES: Record<GeoErrorCode, string> = {
  unsupported: 'Este navegador no permite obtener la ubicación del dispositivo.',
  insecure: 'La ubicación solo funciona en páginas seguras (https) o en localhost.',
  denied: 'El permiso de ubicación está bloqueado para esta página.',
  unavailable: 'No se pudo determinar la posición: el GPS está apagado o no hay señal.',
  timeout: 'Se agotó el tiempo esperando la ubicación del dispositivo.',
};

export function getDevicePosition(): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeoError('unsupported', GEO_MESSAGES.unsupported));
      return;
    }
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      reject(new GeoError('insecure', GEO_MESSAGES.insecure));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }),
      (err) => {
        const code: GeoErrorCode =
          err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable';
        reject(new GeoError(code, GEO_MESSAGES[code]));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export interface Place {
  /** Distrito (o la mejor aproximación disponible) */
  district: string | null;
  /** Calle y número, si OpenStreetMap los tiene */
  address: string | null;
  /** Provincia y departamento, ej. "Lima Metropolitana, Lima" */
  area: string | null;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  city_district?: string;
  municipality?: string;
  town?: string;
  village?: string;
  city?: string;
  county?: string;
  state_district?: string;
  state?: string;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<Place> {
  const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=es&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`No se pudo consultar el distrito (${res.status}).`);
  const data: { address?: NominatimAddress } = await res.json();
  const a = data.address ?? {};

  const street = a.road ?? a.pedestrian;
  const address = street ? [street, a.house_number].filter(Boolean).join(' ') : null;
  // En Perú OpenStreetMap suele guardar el distrito en `city`/`municipality`; el barrio queda en `suburb`/`neighbourhood`
  const district =
    a.city_district ?? a.municipality ?? a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? a.neighbourhood ?? null;
  // Provincia/departamento para dar contexto, sin repetir el distrito
  const area = [a.state_district ?? a.county, a.state].filter((x, i, arr) => x && x !== district && arr.indexOf(x) === i);

  return { district, address, area: area.length ? area.join(', ') : null };
}

export interface AddressResult {
  label: string;
  lat: number;
  lon: number;
}

export async function searchAddress(query: string, signal?: AbortSignal): Promise<AddressResult[]> {
  const url = `${NOMINATIM}/search?format=jsonv2&limit=5&accept-language=es&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`No se pudo buscar la dirección (${res.status}).`);
  const data: { display_name: string; lat: string; lon: string }[] = await res.json();
  return data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lon: Number(d.lon) }));
}
