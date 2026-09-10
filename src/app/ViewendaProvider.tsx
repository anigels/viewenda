import { createContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import type { ViewendaData, ViewendaRepository } from '../data/ViewendaRepository';
import type { ViewendaProfile, WatchlistItem } from '../domain/models';
import { ViewendaStore } from '../data/ViewendaStore';
interface ViewendaContextValue {
  data: ViewendaData | null;
  error: string | null;
  saveProfile: (profile: ViewendaProfile) => Promise<void>;
  updateWatchlist: (transform: (items: WatchlistItem[]) => WatchlistItem[]) => Promise<void>;
  updatePlanning: (transform: (data: ViewendaData) => ViewendaData) => Promise<void>;
}
export const ViewendaContext = createContext<ViewendaContextValue | null>(null);
export function ViewendaProvider({ repository, children }: { repository: ViewendaRepository; children: ReactNode }) {
  const store = useMemo(() => new ViewendaStore(repository), [repository]);
  const { data, error } = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => { void store.initialize(); }, [store]);
  return <ViewendaContext.Provider value={{ data, error,
    saveProfile: profile => store.update('profile', () => profile),
    updateWatchlist: transform => store.update('watchlist', transform),
    updatePlanning: transform => store.transact(transform),
  }}>{children}</ViewendaContext.Provider>;
}
