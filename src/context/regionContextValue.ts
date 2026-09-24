import { createContext } from 'react';
import type { RegionData, RegionSummary } from '../data/regionData';

export interface RegionContextValue {
  regionId: string;
  region: RegionData;
  summary: RegionSummary;
  regions: RegionData[];
  setRegionId: (id: string) => void;
  isRegionsModalOpen: boolean;
  openRegionsModal: () => void;
  closeRegionsModal: () => void;
}

export const RegionContext = createContext<RegionContextValue | null>(null);