import { useContext } from 'react';
import { ViewendaContext } from '../app/ViewendaProvider';
export function useViewenda() {
  const context = useContext(ViewendaContext);
  if (!context) throw new Error('useViewenda must be used inside ViewendaProvider');
  return context;
}
