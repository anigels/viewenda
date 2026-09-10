import { expect, it, vi } from 'vitest';
import { loadUpcoming, reportedEvent } from './upcoming';
import type { MediaReference } from '../../domain/models';
import { TmdbClient } from './client';
const media: MediaReference = { tmdbId: 42, mediaType: 'tv', title: 'Show', posterPath: null };
const episode = { air_date: '2026-09-10', season_number: 2, episode_number: 1 };
it('uses exact reported dates, distinguishes premieres and excludes past or missing dates', () => {
  expect(reportedEvent(media, { next_episode_to_air: episode }, '2026-09-09')).toMatchObject({ ok: true, data: { date: '2026-09-10', eventType: 'episode', episode: { season: 2, number: 1 } } });
  expect(reportedEvent(media, { next_episode_to_air: { ...episode, season_number: 1 } }, '2026-09-09')).toMatchObject({ data: { eventType: 'premiere' } });
  expect(reportedEvent(media, { first_air_date: '2026-09-09', next_episode_to_air: null }, '2026-09-09')).toMatchObject({ data: { eventType: 'premiere', date: '2026-09-09' } });
  expect(reportedEvent(media, { next_episode_to_air: episode }, '2026-09-11')).toEqual({ ok: true, data: null });
  expect(reportedEvent(media, { next_episode_to_air: null }, '2026-09-09')).toEqual({ ok: true, data: null });
  expect(reportedEvent(media, { next_episode_to_air: { ...episode, air_date: '' } }, '2026-09-09')).toEqual({ ok: true, data: null });
});
it('rejects malformed episode data instead of inventing a date or number', () => {
  for (const value of ['bad', { ...episode, air_date: '2026-02-30' }, { ...episode, episode_number: '1' }, { ...episode, season_number: -1 }]) {
    expect(reportedEvent(media, { next_episode_to_air: value }, '2026-01-01').ok).toBe(false);
  }
});
it('bounds concurrency, deduplicates TV IDs, ignores movies and keeps partial success', async () => {
  let active = 0; let highest = 0;
  const tvDetails = vi.fn(async (id: number) => {
    active++; highest = Math.max(highest, active);
    await new Promise(resolve => setTimeout(resolve, 2)); active--;
    if (id === 2) throw new Error('private transport error');
    return { ok: true as const, data: { id, name: 'Show', poster_path: null, overview: '', next_episode_to_air: id === 3 ? null : { id, ...episode } } };
  });
  const shows = Array.from({ length: 9 }, (_, i) => ({ ...media, tmdbId: i + 1 }));
  const input = [...shows, shows[0], { ...media, mediaType: 'movie' as const }];
  const original = JSON.stringify(input);
  const report = await loadUpcoming(input, '2026-09-09', { tvDetails });
  expect(highest).toBe(4); expect(tvDetails).toHaveBeenCalledTimes(9);
  expect(report.events).toHaveLength(7); expect(report.unreported).toHaveLength(1);
  expect(report.failed).toEqual([{ media: shows[1], message: 'Could not check this show. Please try again.' }]);
  expect(JSON.stringify(input)).toBe(original);
});
it('uses the TMDB adapter failure states and stops scheduling cancelled work', async () => {
  const fetcher = vi.fn();
  const report = await loadUpcoming([media], '2026-09-09', new TmdbClient('', fetcher));
  expect(report.failed).toHaveLength(1); expect(report.unreported).toHaveLength(0);
  expect(fetcher).not.toHaveBeenCalled();
  const tvDetails = vi.fn();
  expect(await loadUpcoming([media], '2026-09-09', { tvDetails }, () => true)).toEqual({ events: [], failed: [], unreported: [] });
  expect(tvDetails).not.toHaveBeenCalled();
});
