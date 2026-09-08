import type { MediaId, Vote, WatchNight, WatchPlan } from './models';

/** Calendar-only values stay in local time; do not parse these dates as UTC. */
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000) return false;
  const parsed = new Date(year, month - 1, day, 12);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}
export function validTime(value: string) { return value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
export function requireSchedule(date: string, time = '') {
  if (!validDate(date)) throw new Error('Choose a valid date for your plan.');
  if (!validTime(time)) throw new Error('Choose a valid time, or leave it empty.');
}
export function addDays(date: string, days: number) {
  if (!validDate(date)) throw new Error('Invalid calendar date');
  const parsed = new Date(date + 'T12:00:00');
  parsed.setDate(parsed.getDate() + days);
  return localDate(parsed);
}
export function weekDates(date: string) {
  const day = new Date(date + 'T12:00:00').getDay();
  const monday = addDays(date, -((day + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}
export function readableDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
export function sortPlans(plans: WatchPlan[]) {
  return [...plans].sort((a, b) => a.date.localeCompare(b.date) || (a.optionalTime || '99:99').localeCompare(b.optionalTime || '99:99') || a.media.title.localeCompare(b.media.title));
}
export function normalizeNight(night: WatchNight, availableViewers: string[], availableMedia: MediaId[]): WatchNight {
  const viewerIds = [...new Set(night.viewerIds)].filter(id => availableViewers.includes(id));
  const nomineeMediaIds = [...new Set(night.nomineeMediaIds)].filter(id => availableMedia.includes(id));
  const votes = new Map<string, Vote>();
  for (const vote of night.votes) {
    if (viewerIds.includes(vote.viewerId) && nomineeMediaIds.includes(vote.mediaId)) votes.set(vote.viewerId, vote);
  }
  return { ...night, viewerIds, nomineeMediaIds, votes: [...votes.values()], selectedMediaId: night.selectedMediaId && nomineeMediaIds.includes(night.selectedMediaId) ? night.selectedMediaId : null };
}
export function castVote(night: WatchNight, viewerId: string, mediaId: MediaId | null): WatchNight {
  if (!night.viewerIds.includes(viewerId)) throw new Error('Choose a participating viewer.');
  if (mediaId && !night.nomineeMediaIds.includes(mediaId)) throw new Error('Choose a nominated title.');
  return { ...night, votes: [...night.votes.filter(vote => vote.viewerId !== viewerId), ...(mediaId ? [{ viewerId, mediaId }] : [])] };
}
export function tallyVotes(night: WatchNight) {
  return night.nomineeMediaIds.map(id => ({ id, count: night.votes.filter(vote => vote.mediaId === id).length }));
}
