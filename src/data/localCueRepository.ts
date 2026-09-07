import { createInitialData, type CueData, type CueRepository } from './CueRepository';

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
          !['viewers', 'watchlist', 'watchPlans', 'watchNights'].every(key => Array.isArray(stored.data[key]))) {
        throw new Error('Unsupported storage shape');
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
