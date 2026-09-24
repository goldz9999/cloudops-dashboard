import { useMemo, useState, type ReactNode } from 'react';
import { RegionContext } from './regionContextValue';
import { DEFAULT_REGION_ID, regionsData, summarizeRegion } from '../data/regionData';

export function RegionProvider({ children }: { children: ReactNode }) {
  const [regionId, setRegionId] = useState(DEFAULT_REGION_ID);
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
  }, [regionId, isRegionsModalOpen]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}