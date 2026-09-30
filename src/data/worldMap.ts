import { geoMercator, geoPath } from 'd3-geo';
import type { GeoPermissibleObjects } from 'd3-geo';

// Mapa generado con d3-geo + world-atlas (Natural Earth, dominio público).
// La proyección es la misma para los países y para los marcadores, así que cualquier lat/lon cae en su sitio.

const MAP_WIDTH = 784;
const MAX_LAT = 75;
const MIN_LAT = -56;

// Puntos de referencia que definen el recorte del mapa (no se dibujan)
const extentPoints: GeoPermissibleObjects = {
  type: 'MultiPoint',
  coordinates: [-180, 180].flatMap((lon) => [
    [lon, MAX_LAT],
    [lon, MIN_LAT],
  ]),
};

const projection = geoMercator();
projection.fitWidth(MAP_WIDTH, extentPoints);

const [[x0, y0], [x1, y1]] = geoPath(projection).bounds(extentPoints);

export const WORLD_MAP_VIEWBOX = { minX: x0, minY: y0, width: x1 - x0, height: y1 - y0 };

export function geoToMapXY(lat: number, lon: number) {
  const p = projection([lon, lat]);
  return { x: p ? p[0] : 0, y: p ? p[1] : 0 };
}

let landPathPromise: Promise<string> | null = null;

// Carga perezosa del dibujo de los países (≈750 KB): no pesa en la carga inicial de la app
export function loadWorldLandPath(): Promise<string> {
  landPathPromise ??= (async () => {
    const [{ feature }, { default: topology }] = await Promise.all([
      import('topojson-client'),
      import('world-atlas/countries-50m.json'),
    ]);
    const countries = feature(topology as never, (topology as never as { objects: { countries: never } }).objects.countries) as unknown as {
      features: { id?: string }[];
    };
    const path = geoPath(projection);
    return countries.features
      .filter((f) => f.id !== '010') // Antártida
      .map((f) => path(f as GeoPermissibleObjects))
      .filter((d): d is string => !!d)
      .map((d) => `<path d="${d}"/>`)
      .join('');
  })();
  return landPathPromise;
}
