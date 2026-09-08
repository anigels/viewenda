import { createInitialData, type CueData, type CueRepository } from './CueRepository';
import { watchStatuses } from '../domain/models';

export const STORAGE_KEY = 'cue:data:v1';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
/** Only this adapter knows about localStorage. Failures surface without overwriting data. */
export class LocalCueRepository implements CueRepository {
  constructor(private readonly storage: () => StoragePort = () => window.localStorage) {}
  async load(): Promise<CueData> {
    const raw = this.storage().getItem(STORAGE_KEY);
    if (!raw) return createInitialData();
    try {
      const stored = JSON.parse(raw);
      if (stored.version !== 1 || !stored.data?.profile ||
          typeof stored.data.profile.id !== 'string' ||
          typeof stored.data.profile.name !== 'string' ||
          typeof stored.data.profile.region !== 'string' ||
          !Array.isArray(stored.data.profile.selectedProviderIds) ||
          !stored.data.profile.selectedProviderIds.every((id: unknown) => Number.isSafeInteger(id) && Number(id) > 0) ||
          !['viewers', 'watchlist', 'watchPlans', 'watchNights'].every(key => Array.isArray(stored.data[key]))) {
        throw new Error('Unsupported storage shape');
      }
      if (!stored.data.watchlist.every((item: CueData['watchlist'][number]) => item &&
        item.media && Number.isSafeInteger(item.media.tmdbId) && item.media.tmdbId > 0 &&
        ['movie', 'tv'].includes(item.media.mediaType) && typeof item.media.title === 'string' &&
        (item.media.posterPath === null || typeof item.media.posterPath === 'string') &&
        watchStatuses.includes(item.status) && typeof item.isFavorite === 'boolean' && typeof item.addedAt === 'string')) {
        throw new Error('Unsupported watchlist shape');
      }
      return stored.data as CueData;
    } catch {
      throw new Error('Cue could not read your saved data. Your original data has been kept.');
    }
  }
  async save<K extends keyof CueData>(collection: K, value: CueData[K]): Promise<void> {
    const data = await this.load();
    data[collection] = value;
    this.storage().setItem(STORAGE_KEY, JSON.stringify({ version: 1, data }));
  }
}
