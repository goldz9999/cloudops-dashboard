import { Globe2 } from 'lucide-react';
import { useRegion } from '../../context/useRegion';
import { regionLabel } from '../../data/regionData';
import Select from './Select';

interface Props {
  /** Versión compacta para la barra superior */
  compact?: boolean;
}

export default function RegionSelector({ compact = false }: Props) {
  const { regionId, regions, setRegionId } = useRegion();

  return (
    <div className="flex items-center gap-2 min-w-0">
      <Globe2 className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-text-secondary shrink-0 text-xs">{compact ? 'Región:' : 'Región actual:'}</span>
      <Select
        variant="inline"
        ariaLabel="Seleccionar región"
        value={regionId}
        onChange={setRegionId}
        options={regions.map((r) => ({ value: r.id, label: `${r.id} — ${regionLabel(r)}` }))}
        className="max-w-full"
      />
    </div>
  );
}