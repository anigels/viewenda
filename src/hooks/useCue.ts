import { useContext } from 'react';
import { CueContext } from '../app/CueProvider';
export function useCue() {
  const context = useContext(CueContext);
  if (!context) throw new Error('useCue must be used inside CueProvider');
  return context;
}
