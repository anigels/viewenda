import { expect, it, vi } from 'vitest';
import { saveProgress } from './episodes';
import { addTitle } from './watchlist';
import { createInitialData } from '../data/ViewendaRepository';
import { saveManualPlan, reschedulePlan, removePlan } from '../data/planningActions';
import { LocalViewendaRepository, STORAGE_KEY } from '../data/localViewendaRepository';
import { nextToWatch } from '../services/tmdb/nextToWatch';
import { TmdbClient } from '../services/tmdb/client';
const media = { tmdbId: 42, mediaType: 'tv' as const, title: 'Show', posterPath: null };
it('stores explicit progress without changing status, favorites or title-level plans, and reloads it', async () => {
  let raw: string | null = null;
  const repository = new LocalViewendaRepository(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }));
  const data = createInitialData(); data.watchlist = addTitle([], media);
  data.watchlist[0].isFavorite = true;
  data.watchlist = saveProgress(data.watchlist, media, { season: 2, number: 3 });
  await repository.saveAll(data);
  expect((await repository.load()).watchlist[0]).toMatchObject({ status: 'Want to Watch', isFavorite: true, lastCompletedEpisode: { season: 2, number: 3 } });
  expect(saveProgress(data.watchlist, media, null)[0].lastCompletedEpisode).toBeNull();
  expect(() => saveProgress(data.watchlist, media, { season: 0, number: 1 })).toThrow();
  const malformed = JSON.stringify({ version: 1, data: { ...data, watchlist: [{ ...data.watchlist[0], lastCompletedEpisode: { season: 1, number: '3' } }] } });
  raw = malformed;
  await expect(repository.saveAll(data)).rejects.toThrow(); expect(raw).toBe(malformed);
  expect(STORAGE_KEY).toBeTruthy();
});
it('preserves episode snapshots on reschedule, rejects same-day duplicates, and keeps progress on removal', () => {
  let data = createInitialData(); data.watchlist = saveProgress(addTitle([], media), media, { season: 2, number: 3 });
  const plan = { id: 'p', media, date: '2026-09-12', source: 'manual' as const, episode: { season: 2, number: 4, name: 'Next chapter', airDate: '2026-09-10' } };
  data = saveManualPlan(data, plan);
  expect(() => saveManualPlan(data, { ...plan, id: 'duplicate' })).toThrow('already');
  data = reschedulePlan(data, 'p', '2026-09-15', '21:00');
  expect(data.watchPlans[0].episode).toEqual(plan.episode);
  data = saveManualPlan(data, { ...plan, id: 'other' });
  expect(() => reschedulePlan(data, 'other', '2026-09-15', '')).toThrow('already');
  expect(removePlan(data, 'p').watchlist).toEqual(data.watchlist);
});
it('finds next unwatched episodes from metadata rather than incrementing numbers, including season boundaries', async () => {
  const client = { tvSeasons: vi.fn(async () => ({ ok: true as const, data: [1, 2] })), seasonEpisodes: vi.fn(async (_id: number, season: number) => ({ ok: true as const, data: season === 1 ? [{ season: 1, number: 1 }, { season: 1, number: 3 }] : [{ season: 2, number: 1 }] })) };
  expect(await nextToWatch(42, { season: 1, number: 1 }, client)).toMatchObject({ data: { season: 1, number: 3 } });
  expect(await nextToWatch(42, { season: 1, number: 3 }, client)).toMatchObject({ data: { season: 2, number: 1 } });
  expect(await nextToWatch(42, null, client)).toMatchObject({ data: { season: 1, number: 1 } });
  expect((await nextToWatch(42, { season: 1, number: 2 }, client)).ok).toBe(false);
  expect(await nextToWatch(42, { season: 2, number: 1 }, client)).toEqual({ ok: true, data: null });
});
it('does not skip a failed season to claim a later episode is next', async () => {
  const failure = { ok: false as const, error: { kind: 'network' as const, message: 'Offline' } };
  const client = { tvSeasons: async () => ({ ok: true as const, data: [1, 2] }), seasonEpisodes: vi.fn(async () => failure) };
  expect(await nextToWatch(42, null, client)).toEqual(failure);
  expect(client.seasonEpisodes).toHaveBeenCalledTimes(1);
});
it('normalizes real season responses and rejects malformed dates without inventing them', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ id: 42, seasons: [{ season_number: 0 }, { season_number: 2 }, { season_number: 1 }] }))).mockResolvedValueOnce(new Response(JSON.stringify({ season_number: 1, episodes: [{ season_number: 1, episode_number: 1, name: 'Pilot', air_date: null }] }))).mockResolvedValueOnce(new Response(JSON.stringify({ season_number: 1, episodes: [{ season_number: 1, episode_number: 1, air_date: '2026-02-30' }] })));
  const client = new TmdbClient('fixture-only', fetcher);
  expect(await client.tvSeasons(42)).toEqual({ ok: true, data: [1, 2] });
  expect(await client.seasonEpisodes(42, 1)).toEqual({ ok: true, data: [{ season: 1, number: 1, name: 'Pilot' }] });
  expect((await client.seasonEpisodes(42, 1)).ok).toBe(false);
});
