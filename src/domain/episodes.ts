import { mediaId, type EpisodePosition, type EpisodeReference, type MediaReference, type WatchlistItem } from './models';
import { validDate } from './planning';
export function validPosition(value: unknown): value is EpisodePosition {
  if (!value || typeof value !== 'object') return false;
  const p = value as EpisodePosition;
  return Number.isSafeInteger(p.season) && p.season >= 1 && Number.isSafeInteger(p.number) && p.number >= 1;
}
export function validEpisode(value: unknown): value is EpisodeReference {
  if (!validPosition(value)) return false;
  const p = value as EpisodeReference;
  return (p.name === undefined || typeof p.name === 'string') && (p.airDate === undefined || typeof p.airDate === 'string' && validDate(p.airDate));
}
export const episodeLabel = (episode: EpisodePosition) => `Season ${episode.season} · Episode ${episode.number}`;
export const afterEpisode = (episode: EpisodePosition, last: EpisodePosition | null) => !last || episode.season > last.season || episode.season === last.season && episode.number > last.number;
export function saveProgress(items: WatchlistItem[], media: MediaReference, last: EpisodePosition | null) {
  if (media.mediaType !== 'tv' || last !== null && !validPosition(last)) throw new Error('Choose a valid TV episode.');
  if (!items.some(item => mediaId(item.media) === mediaId(media))) throw new Error('This show is no longer saved.');
  return items.map(item => mediaId(item.media) === mediaId(media) ? { ...item, lastCompletedEpisode: last } : item);
}
