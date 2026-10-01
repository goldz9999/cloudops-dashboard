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