import { expect, it, vi } from 'vitest';
import { CueStore } from './CueStore';
import { createInitialData, type CueRepository } from './CueRepository';
import { addTitle, editTitle, filterTitles } from '../domain/watchlist';
const movie = { tmdbId: 42, mediaType: 'movie' as const, title: 'A story', posterPath: null };
const tv = { ...movie, mediaType: 'tv' as const };
it('deduplicates by media type and ID without resetting status or favorites', () => {
  let items = addTitle([], movie);
  items = editTitle(items, movie, { status: 'Watched', isFavorite: true });
  expect(addTitle(items, movie)).toBe(items);
  items = addTitle(items, tv);
  expect(items).toHaveLength(2);
  expect(filterTitles(items, 'story', 'Watched', true)).toHaveLength(1);
  expect(editTitle(items, movie, { status: 'Watching' })[1].isFavorite).toBe(true);
});
it('serializes rapid additions and profile updates without dropping either title', async () => {
  const saved = createInitialData();
  const repository: CueRepository = { load: async () => saved, saveAll: async value => { Object.assign(saved, value); }, save: async (key, value) => { await new Promise(resolve => setTimeout(resolve, 5)); Object.assign(saved, { [key]: value }); } };
  const store = new CueStore(repository);
  await store.initialize();
  await Promise.all([store.update('watchlist', items => addTitle(items, movie)), store.update('watchlist', items => addTitle(items, tv)), store.update('profile', p => ({ ...p, region: 'CA' }))]);
  expect(store.getSnapshot().data?.watchlist).toHaveLength(2);
  expect(saved.watchlist).toHaveLength(2);
  expect(saved.profile.region).toBe('CA');
});
it('retains state on failed save and allows the next operation to succeed', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('quota')).mockResolvedValue(undefined);
  const store = new CueStore({ load: async () => createInitialData(), save, saveAll: async () => {} });
  await store.initialize();
  await expect(store.update('watchlist', items => addTitle(items, movie))).rejects.toThrow('quota');
  expect(store.getSnapshot().data?.watchlist).toEqual([]);
  await store.update('watchlist', items => addTitle(items, tv));
  expect(store.getSnapshot().data?.watchlist[0].media.mediaType).toBe('tv');
});
