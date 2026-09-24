import { useContext } from 'react';
import { RegionContext } from './regionContextValue';

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion debe usarse dentro de <RegionProvider>');
  return ctx;
}