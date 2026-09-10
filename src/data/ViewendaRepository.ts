import type { ViewendaProfile, ViewerProfile, WatchlistItem, WatchPlan, WatchNight } from '../domain/models';

export interface ViewendaData {
  profile: ViewendaProfile;
  viewers: ViewerProfile[];
  watchlist: WatchlistItem[];
  watchPlans: WatchPlan[];
  watchNights: WatchNight[];
}
/** Async contract keeps UI independent of the eventual storage transport. */
export interface ViewendaRepository {
  load(): Promise<ViewendaData>;
  save<K extends keyof ViewendaData>(collection: K, value: ViewendaData[K]): Promise<void>;
  saveAll(data: ViewendaData): Promise<void>; // Atomic snapshot for related planning changes.
}
export const createInitialData = (): ViewendaData => ({
  profile: { id: 'primary', name: 'My Viewenda', region: 'US', selectedProviderIds: [] },
  viewers: [], watchlist: [], watchPlans: [], watchNights: [],
});
