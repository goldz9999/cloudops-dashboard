import { Globe2 } from 'lucide-react';
import { useRegion } from '../../context/useRegion';
import { regionLabel } from '../../data/regionData';

interface Props {
  /** Versión compacta para la barra superior */
  compact?: boolean;
}

export default function RegionSelector({ compact = false }: Props) {
  const { regionId, regions, setRegionId } = useRegion();

  return (
    <label className="flex items-center gap-2 min-w-0">
      <Globe2 className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-text-secondary shrink-0 text-xs">{compact ? 'Región:' : 'Región actual:'}</span>
      <select
        value={regionId}
        onChange={(e) => setRegionId(e.target.value)}
        aria-label="Seleccionar región"
        className="min-w-0 max-w-full bg-transparent text-xs font-medium text-text-main focus:outline-none cursor-pointer truncate"
      >
        {regions.map((r) => (
          <option key={r.id} value={r.id}>
            {r.id} — {regionLabel(r)}
          </option>
        ))}
      </select>
    </label>
  );
}