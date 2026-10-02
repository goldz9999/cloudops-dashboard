import { api } from './client';

export interface Place {
    district: string | null;
    address: string | null;
    area: string | null;
}

export interface RegionRecommendation {
    regionId: string;
    name: string;
    location: string;
    distanceKm: number;
    message: string;
}

/** Reverse geocode vía backend (Nominatim). Coordenadas solo del GPS del dispositivo. */
export async function reverseGeocode(lat: number, lon: number): Promise<Place> {
    return api<Place>(`/geo/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
}

/** Región AWS recomendada según lat/lon del usuario. */
export async function recommendRegion(lat: number, lon: number): Promise<RegionRecommendation> {
    return api<RegionRecommendation>(
        `/geo/recommend-region?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    );
}

export interface IpLocation {
    ip: string | null;
    lat: number;
    lon: number;
    /** Incertidumbre en metros (la ubicación por IP es de nivel ciudad) */
    accuracy: number;
    city: string | null;
    region: string | null;
    country: string | null;
    provider: string;
}

/** Ubicación aproximada por IP (respaldo cuando el GPS no está disponible). La resuelve el backend. */
export async function fetchIpLocation(): Promise<IpLocation> {
    return api<IpLocation>('/geo/ip');
}

/** Lugar legible a partir de una ubicación por IP: ciudad como "distrito" aproximado, sin dirección. */
export function placeFromIp(loc: IpLocation): Place {
    const area = [loc.region, loc.country].filter((x, i, arr): x is string => !!x && x !== loc.city && arr.indexOf(x) === i);
    return { district: loc.city, address: null, area: area.length ? area.join(', ') : null };
}

export function getDevicePosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Este navegador no soporta geolocalización.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60_000,
        });
    });
}