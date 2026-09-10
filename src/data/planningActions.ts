import type { ViewendaData } from './ViewendaRepository';
import { mediaId, type WatchNight, type WatchPlan } from '../domain/models';
import { normalizeNight, requireSchedule } from '../domain/planning';
import { validEpisode } from '../domain/episodes';

export const allViewers = (data: ViewendaData) => [{ id: data.profile.id, name: data.profile.name }, ...data.viewers];
export const currentNight = (data: ViewendaData) => data.watchNights.find(night => !night.watchPlanId);
export function cleanNight(data: ViewendaData, night: WatchNight) {
  return normalizeNight(night, allViewers(data).map(viewer => viewer.id), data.watchlist.map(item => mediaId(item.media)));
}
export function changeNight(data: ViewendaData, id: string, change: (night: WatchNight) => WatchNight): ViewendaData {
  const night = data.watchNights.find(night => night.id === id && !night.watchPlanId);
  if (!night) throw new Error('This watch night is no longer a draft. Start another night.');
  const next = cleanNight(data, change(cleanNight(data, night)));
  return { ...data, watchNights: data.watchNights.map(item => item.id === id ? next : item) };
}
export function startNight(data: ViewendaData, id: string): ViewendaData {
  if (currentNight(data)) return data;
  return { ...data, watchNights: [...data.watchNights, { id, viewerIds: [data.profile.id], nomineeMediaIds: [], votes: [], selectedMediaId: null }] };
}
export function addViewer(data: ViewendaData, id: string, name: string): ViewendaData {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) throw new Error('Enter a viewer name of 1–40 characters.');
  if (allViewers(data).some(viewer => viewer.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) throw new Error('That viewer name already exists.');
  return { ...data, viewers: [...data.viewers, { id, name: trimmed }] };
}
export function removeViewer(data: ViewendaData, id: string): ViewendaData {
  if (id === data.profile.id) throw new Error('The primary profile cannot be removed here.');
  const next = { ...data, viewers: data.viewers.filter(viewer => viewer.id !== id) };
  return { ...next, watchNights: next.watchNights.map(night => night.watchPlanId ? night : cleanNight(next, night)) };
}
export function scheduleNight(data: ViewendaData, nightId: string, planId: string, date: string, time: string): ViewendaData {
  requireSchedule(date, time);
  const stored = data.watchNights.find(night => night.id === nightId);
  if (!stored || stored.watchPlanId) throw new Error('This watch night has already been scheduled or removed.');
  const night = cleanNight(data, stored);
  if (!night.viewerIds.length) throw new Error('Choose at least one viewer.');
  const media = data.watchlist.find(item => mediaId(item.media) === night.selectedMediaId)?.media;
  if (!media) throw new Error('Choose a nominated title that is still in your watchlist.');
  const plan: WatchPlan = { id: planId, media: { ...media }, date, ...(time ? { optionalTime: time } : {}), source: 'planTonight' };
  return { ...data, watchPlans: [...data.watchPlans, plan], watchNights: data.watchNights.map(item => item.id === nightId ? { ...night, watchPlanId: planId } : item) };
}
export function saveManualPlan(data: ViewendaData, plan: WatchPlan): ViewendaData {
  requireSchedule(plan.date, plan.optionalTime ?? '');
  if (plan.episode) {
    if (plan.media.mediaType !== 'tv' || !validEpisode(plan.episode)) throw new Error('Choose a valid TV episode.');
    if (data.watchPlans.some(item => mediaId(item.media) === mediaId(plan.media) && item.date === plan.date && item.episode?.season === plan.episode?.season && item.episode?.number === plan.episode?.number)) throw new Error('This episode is already in your lineup for that date.');
  }
  if (!data.watchlist.some(item => mediaId(item.media) === mediaId(plan.media))) throw new Error('That title is no longer in your watchlist.');
  if (data.watchPlans.some(item => item.id === plan.id)) throw new Error('This plan is already saved.');
  return { ...data, watchPlans: [...data.watchPlans, { ...plan, source: 'manual' }] };
}
export function reschedulePlan(data: ViewendaData, id: string, date: string, time: string): ViewendaData {
  requireSchedule(date, time);
  if (!data.watchPlans.some(plan => plan.id === id)) throw new Error('This plan no longer exists.');
  const current = data.watchPlans.find(plan => plan.id === id)!;
  if (current.episode && data.watchPlans.some(plan => plan.id !== id && mediaId(plan.media) === mediaId(current.media) && plan.date === date && plan.episode?.season === current.episode?.season && plan.episode?.number === current.episode?.number)) throw new Error('This episode is already in your lineup for that date.');
  return { ...data, watchPlans: data.watchPlans.map(plan => {
    if (plan.id !== id) return plan;
    const { optionalTime: _oldTime, ...rest } = plan;
    return { ...rest, date, ...(time ? { optionalTime: time } : {}) };
  }) };
}
export function removePlan(data: ViewendaData, id: string): ViewendaData {
  return { ...data, watchPlans: data.watchPlans.filter(plan => plan.id !== id), watchNights: data.watchNights.filter(night => night.watchPlanId !== id) };
}
