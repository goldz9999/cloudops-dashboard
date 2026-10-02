import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  position: { lat: number; lon: number; accuracy: number | null } | null;
  /** Se llama al hacer click en el mapa (ubicación manual) */
  onPick: (lat: number, lon: number) => void;
}

// Lima, mientras no haya una ubicación
const DEFAULT_CENTER: [number, number] = [-12.0464, -77.0428];

export default function LocationMap({ position, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => onPickRef.current(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!position) return;

    const latlng: L.LatLngExpression = [position.lat, position.lon];
    let circle: L.Circle | null = null;
    if (position.accuracy) {
      circle = L.circle(latlng, {
        radius: position.accuracy,
        color: '#2563EB',
        weight: 1,
        fillColor: '#2563EB',
        fillOpacity: 0.12,
      }).addTo(layer);
    }
    L.circleMarker(latlng, {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#2563EB',
      fillOpacity: 1,
    }).addTo(layer);
    // Ubicación aproximada (por IP): se encuadra todo el círculo en vez de acercar a un punto
    if (circle && position.accuracy && position.accuracy > 1000) {
      map.flyToBounds(circle.getBounds(), { duration: 0.8, padding: [20, 20] });
    } else {
      map.flyTo(latlng, 17, { duration: 0.8 });
    }
  }, [position]);

  return <div ref={containerRef} className="w-full h-full" />;
}