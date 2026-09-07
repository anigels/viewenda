import { describe, expect, it } from 'vitest';
import { LocalCueRepository, STORAGE_KEY } from './localCueRepository';
import { mediaId } from '../domain/models';

function memoryStorage() {
  const items = new Map<string, string>();
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, value); } };
}
describe('local repository', () => {
  it('defaults to one US primary profile and persists profile changes across instances', async () => {
    const storage = memoryStorage();
    const repo = new LocalCueRepository(() => storage);
    const initial = await repo.load();
    expect(initial.profile.region).toBe('US');
    expect(initial.viewers).toEqual([]);
    await repo.save('profile', { ...initial.profile, region: 'CA', selectedProviderIds: [8] });
    const loaded = await new LocalCueRepository(() => storage).load();
    expect(loaded.profile.region).toBe('CA');
    expect(loaded.profile.selectedProviderIds).toEqual([8]);
  });
  it('saves every collection without overwriting the others and keeps favorites independent', async () => {
    const storage = memoryStorage();
    const repo = new LocalCueRepository(() => storage);
    const media = { tmdbId: 42, mediaType: 'tv' as const, title: 'Example', posterPath: null };
    await repo.save('viewers', [{ id: 'v1', name: 'Alex' }]);
    await repo.save('watchlist', [{ media, status: 'Watched', isFavorite: true, addedAt: '2026-01-01T00:00:00Z' }]);
    await repo.save('watchPlans', [{ id: 'p1', media, date: '2026-09-08', source: 'manual' }]);
    await repo.save('watchNights', [{ id: 'n1', viewerIds: ['v1'], nomineeMediaIds: ['tv:42'], votes: [], selectedMediaId: 'tv:42' }]);
    const result = await repo.load();
    expect(result.viewers).toHaveLength(1);
    expect(result.watchlist[0]).toMatchObject({ status: 'Watched', isFavorite: true });
    expect(result.watchPlans[0].optionalTime).toBeUndefined();
    expect(result.watchNights[0].votes).toEqual([]);
    expect(mediaId(media)).not.toBe(mediaId({ ...media, mediaType: 'movie' }));
  });
  it('preserves malformed and future-version data instead of resetting it', async () => {
    for (const raw of ['not json', JSON.stringify({ version: 2, data: {} })]) {
      const storage = memoryStorage(); storage.setItem(STORAGE_KEY, raw);
      const repo = new LocalCueRepository(() => storage);
      await expect(repo.load()).rejects.toThrow();
      await expect(repo.save('viewers', [])).rejects.toThrow();
      expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    }
  });
  it('surfaces storage access and quota failures', async () => {
    const repo = new LocalCueRepository(() => ({ getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); } }));
    await expect(repo.save('viewers', [])).rejects.toThrow('Quota exceeded');
  });
});
