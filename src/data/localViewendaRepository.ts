import { createInitialData, type ViewendaData, type ViewendaRepository } from './ViewendaRepository';
import { watchStatuses } from '../domain/models';
import { validDate, validTime } from '../domain/planning';

// Retained legacy key: branding must not reset existing local data.
export const STORAGE_KEY = 'cue:data:v1';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
/** Only this adapter knows about localStorage. Failures surface without overwriting data. */
export class LocalViewendaRepository implements ViewendaRepository {
  constructor(private readonly storage: () => StoragePort = () => window.localStorage) {}
  async load(): Promise<ViewendaData> {
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
      if (!stored.data.watchlist.every((item: ViewendaData['watchlist'][number]) => item &&
        item.media && Number.isSafeInteger(item.media.tmdbId) && item.media.tmdbId > 0 &&
        ['movie', 'tv'].includes(item.media.mediaType) && typeof item.media.title === 'string' &&
        (item.media.posterPath === null || typeof item.media.posterPath === 'string') &&
        watchStatuses.includes(item.status) && typeof item.isFavorite === 'boolean' && typeof item.addedAt === 'string')) {
        throw new Error('Unsupported watchlist shape');
      }
      const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
      if (!stored.data.viewers.every((viewer: ViewendaData['viewers'][number]) => viewer && typeof viewer.id === 'string' && typeof viewer.name === 'string') ||
          !stored.data.watchPlans.every((plan: ViewendaData['watchPlans'][number]) => plan && typeof plan.id === 'string' &&
            typeof plan.date === 'string' && validDate(plan.date) && (plan.optionalTime === undefined || typeof plan.optionalTime === 'string' && validTime(plan.optionalTime)) &&
            ['manual', 'planTonight'].includes(plan.source) && plan.media && Number.isSafeInteger(plan.media.tmdbId) && plan.media.tmdbId > 0 &&
            ['movie', 'tv'].includes(plan.media.mediaType) && typeof plan.media.title === 'string' && (plan.media.posterPath === null || typeof plan.media.posterPath === 'string')) ||
          !stored.data.watchNights.every((night: ViewendaData['watchNights'][number]) => night && typeof night.id === 'string' &&
            strings(night.viewerIds) && strings(night.nomineeMediaIds) && Array.isArray(night.votes) &&
            night.votes.every(vote => vote && typeof vote.viewerId === 'string' && typeof vote.mediaId === 'string') &&
            (night.selectedMediaId === null || typeof night.selectedMediaId === 'string') && (night.watchPlanId === undefined || typeof night.watchPlanId === 'string'))) {
        throw new Error('Unsupported planning shape');
      }
      return stored.data as ViewendaData;
    } catch {
      throw new Error('Viewenda could not read your saved data. Your original data has been kept.');
    }
  }
  async save<K extends keyof ViewendaData>(collection: K, value: ViewendaData[K]): Promise<void> {
    const data = await this.load();
    data[collection] = value;
    this.storage().setItem(STORAGE_KEY, JSON.stringify({ version: 1, data }));
  }
  async saveAll(data: ViewendaData): Promise<void> {
    await this.load(); // Do not overwrite unrecognized or unreadable existing data.
    this.storage().setItem(STORAGE_KEY, JSON.stringify({ version: 1, data }));
  }
}
