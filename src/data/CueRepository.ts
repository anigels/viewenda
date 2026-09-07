import type { CueProfile, ViewerProfile, WatchlistItem, WatchPlan, WatchNight } from '../domain/models';

export interface CueData {
  profile: CueProfile;
  viewers: ViewerProfile[];
  watchlist: WatchlistItem[];
  watchPlans: WatchPlan[];
  watchNights: WatchNight[];
}
/** Async contract keeps UI independent of the eventual storage transport. */
export interface CueRepository {
  load(): Promise<CueData>;
  save<K extends keyof CueData>(collection: K, value: CueData[K]): Promise<void>;
}
export const createInitialData = (): CueData => ({
  profile: { id: 'primary', name: 'My Cue', region: 'US', selectedProviderIds: [] },
  viewers: [], watchlist: [], watchPlans: [], watchNights: [],
});
