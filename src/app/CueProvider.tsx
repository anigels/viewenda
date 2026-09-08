import { createContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import type { CueData, CueRepository } from '../data/CueRepository';
import type { CueProfile, WatchlistItem } from '../domain/models';
import { CueStore } from '../data/CueStore';
interface CueContextValue {
  data: CueData | null;
  error: string | null;
  saveProfile: (profile: CueProfile) => Promise<void>;
  updateWatchlist: (transform: (items: WatchlistItem[]) => WatchlistItem[]) => Promise<void>;
  updatePlanning: (transform: (data: CueData) => CueData) => Promise<void>;
}
export const CueContext = createContext<CueContextValue | null>(null);
export function CueProvider({ repository, children }: { repository: CueRepository; children: ReactNode }) {
  const store = useMemo(() => new CueStore(repository), [repository]);
  const { data, error } = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => { void store.initialize(); }, [store]);
  return <CueContext.Provider value={{ data, error,
    saveProfile: profile => store.update('profile', () => profile),
    updateWatchlist: transform => store.update('watchlist', transform),
    updatePlanning: transform => store.transact(transform),
  }}>{children}</CueContext.Provider>;
}
