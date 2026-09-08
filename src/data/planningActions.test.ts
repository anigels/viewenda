import { expect, it, vi } from 'vitest';
import { createInitialData } from './CueRepository';
import { CueStore } from './CueStore';
import { addTitle } from '../domain/watchlist';
import { addDays, castVote, requireSchedule, tallyVotes, weekDates } from '../domain/planning';
import { addViewer, changeNight, cleanNight, currentNight, removePlan, removeViewer, reschedulePlan, saveManualPlan, scheduleNight, startNight } from './planningActions';

const movie = { tmdbId: 42, mediaType: 'movie' as const, title: 'Movie', posterPath: null };
const tv = { ...movie, mediaType: 'tv' as const, title: 'Series' };
function draft() {
  let data = createInitialData();
  data.watchlist = addTitle(addTitle([], movie), tv);
  data = startNight(addViewer(data, 'friend', 'Alex'), 'night');
  return changeNight(data, 'night', night => ({ ...night, viewerIds: [data.profile.id, 'friend'], nomineeMediaIds: ['movie:42', 'tv:42'], selectedMediaId: 'movie:42' }));
}
it('replaces and clears a vote, counts ties, and rejects votes from outside the night', () => {
  let night = currentNight(draft())!;
  night = castVote(night, 'friend', 'movie:42');
  night = castVote(night, 'friend', 'tv:42');
  expect(night.votes).toEqual([{ viewerId: 'friend', mediaId: 'tv:42' }]);
  night = castVote(night, night.viewerIds[0], 'movie:42');
  expect(tallyVotes(night).map(vote => vote.count)).toEqual([1, 1]);
  expect(castVote(night, 'friend', null).votes).toHaveLength(1);
  expect(() => castVote(night, 'stranger', 'movie:42')).toThrow();
  expect(() => castVote(night, 'friend', 'tv:999')).toThrow();
});
it('cleans participation, votes and chosen title when a viewer or nominee is removed', () => {
  let data = draft();
  data = changeNight(data, 'night', night => castVote(night, 'friend', 'movie:42'));
  expect(currentNight(removeViewer(data, 'friend'))?.votes).toEqual([]);
  data.watchlist = data.watchlist.filter(item => item.media.mediaType === 'tv');
  expect(cleanNight(data, currentNight(data)!)).toMatchObject({ nomineeMediaIds: ['tv:42'], votes: [], selectedMediaId: null });
  expect(() => scheduleNight(data, 'night', 'plan', '2026-09-08', '')).toThrow();
});
it('schedules a direct pick without votes or time and keeps the watchlist independent', () => {
  const initial = draft();
  let data = scheduleNight(initial, 'night', 'plan', '2026-09-08', '');
  expect(currentNight(data)).toBeUndefined();
  expect(data.watchPlans[0]).toMatchObject({ media: movie, date: '2026-09-08', source: 'planTonight' });
  expect(data.watchPlans[0].optionalTime).toBeUndefined();
  expect(() => scheduleNight(data, 'night', 'another', '2026-09-08', '')).toThrow();
  data = reschedulePlan(data, 'plan', '2026-09-10', '20:30');
  expect(data.watchPlans[0]).toMatchObject({ source: 'planTonight', optionalTime: '20:30' });
  data = reschedulePlan(data, 'plan', '2026-09-10', '');
  expect(data.watchPlans[0].optionalTime).toBeUndefined();
  data = removePlan(data, 'plan');
  expect(data.watchPlans).toEqual([]);
  expect(data.watchNights).toEqual([]);
  expect(data.watchlist).toEqual(initial.watchlist);
});
it('requires a date and uses local calendar weeks across month/year and daylight-saving boundaries', () => {
  for (const date of ['', '2026-02-29', '2026-13-01']) expect(() => requireSchedule(date)).toThrow();
  expect(() => requireSchedule('2028-02-29', '24:00')).toThrow();
  expect(() => requireSchedule('2028-02-29', '')).not.toThrow();
  expect(weekDates('2027-01-01')).toEqual(['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
});
it('validates viewer names and manual plan references', () => {
  const data = draft();
  expect(() => addViewer(data, 'other', ' alex ')).toThrow();
  expect(() => addViewer(data, 'other', '  ')).toThrow();
  expect(() => removeViewer(data, data.profile.id)).toThrow();
  expect(() => saveManualPlan(data, { id: 'p', media: { ...tv, tmdbId: 999 }, date: '2026-09-08', source: 'manual' })).toThrow();
  expect(saveManualPlan(data, { id: 'p', media: tv, date: '2026-09-08', source: 'manual' }).watchPlans[0].media.mediaType).toBe('tv');
});
it('keeps the whole draft after a failed atomic save and serializes a successful retry with other writes', async () => {
  const initial = draft();
  const saveAll = vi.fn().mockRejectedValueOnce(new Error('quota')).mockResolvedValue(undefined);
  const store = new CueStore({ load: async () => initial, save: async () => {}, saveAll });
  await store.initialize();
  const schedule = (data: typeof initial) => scheduleNight(data, 'night', 'plan', '2026-09-08', '');
  await expect(store.transact(schedule)).rejects.toThrow('quota');
  expect(store.getSnapshot().data).toEqual(initial);
  await Promise.all([store.transact(schedule), store.update('profile', profile => ({ ...profile, region: 'CA' }))]);
  expect(store.getSnapshot().data?.watchPlans).toHaveLength(1);
  expect(store.getSnapshot().data?.watchNights[0].watchPlanId).toBe('plan');
  expect(store.getSnapshot().data?.profile.region).toBe('CA');
});
