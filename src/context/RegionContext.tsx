import { useMemo, useState, type ReactNode } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { RegionContext } from './regionContextValue';
import { DEFAULT_REGION_ID, regionsData, summarizeRegion } from '../data/regionData';

const isRegionId = (v: unknown): v is string => typeof v === 'string' && regionsData.some((r) => r.id === v);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [regionId, setRegionId] = usePersistentState<string>('region', DEFAULT_REGION_ID, isRegionId);
  const [isRegionsModalOpen, setModalOpen] = useState(false);

  const value = useMemo(() => {
    const region = regionsData.find((r) => r.id === regionId) ?? regionsData[0];
    return {
      regionId: region.id,
      region,
      summary: summarizeRegion(region),
      regions: regionsData,
      setRegionId,
      isRegionsModalOpen,
      openRegionsModal: () => setModalOpen(true),
      closeRegionsModal: () => setModalOpen(false),
    };
  }, [regionId, setRegionId, isRegionsModalOpen]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}