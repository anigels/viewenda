import type { AutomaticEvent, MediaReference } from '../../domain/models';
import { validDate } from '../../domain/planning';
import type { TmdbClient, TmdbResult } from './client';

export interface TvAirEvent extends AutomaticEvent {
  episode?: { season: number; number: number };
}
export interface UpcomingReport {
  events: TvAirEvent[];
  unreported: MediaReference[];
  failed: { media: MediaReference; message: string }[];
}
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const date = (value: unknown): value is string => typeof value === 'string' && validDate(value);
/** Read only reported dates; never infer an episode schedule or streaming availability. */
export function reportedEvent(media: MediaReference, details: { first_air_date?: unknown; next_episode_to_air?: unknown }, today: string): TmdbResult<TvAirEvent | null> {
  const episode = details.next_episode_to_air;
  if (episode !== null && episode !== undefined) {
    if (!object(episode)) return { ok: false, error: { kind: 'response', message: 'The next episode data could not be read.' } };
    if (episode.air_date !== null && episode.air_date !== undefined && episode.air_date !== '' && !date(episode.air_date)) {
      return { ok: false, error: { kind: 'response', message: 'The reported episode date is invalid.' } };
    }
    if (date(episode.air_date) && episode.air_date >= today) {
      if (!Number.isSafeInteger(episode.season_number) || Number(episode.season_number) < 0 || !Number.isSafeInteger(episode.episode_number) || Number(episode.episode_number) < 1) {
        return { ok: false, error: { kind: 'response', message: 'The episode numbering could not be read.' } };
      }
      return { ok: true, data: { media, date: episode.air_date, eventType: episode.season_number === 1 && episode.episode_number === 1 ? 'premiere' : 'episode', episode: { season: Number(episode.season_number), number: Number(episode.episode_number) } } };
    }
  }
  if (date(details.first_air_date) && details.first_air_date >= today) return { ok: true, data: { media, date: details.first_air_date, eventType: 'premiere' } };
  return { ok: true, data: null };
}
/** Four requests at a time, one per saved show. A failure must not hide other shows. */
export async function loadUpcoming(media: MediaReference[], today: string, client: Pick<TmdbClient, 'tvDetails'>, cancelled = () => false): Promise<UpcomingReport> {
  const shows = [...new Map(media.filter(item => item.mediaType === 'tv').map(item => [item.tmdbId, item])).values()];
  const report: UpcomingReport = { events: [], unreported: [], failed: [] };
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, shows.length) }, async () => {
    while (next < shows.length && !cancelled()) {
      const media = shows[next++];
      try {
        const response = await client.tvDetails(media.tmdbId);
        const result = response.ok ? reportedEvent(media, response.data, today) : response;
        if (!result.ok) report.failed.push({ media, message: result.error.message });
        else if (result.data) report.events.push(result.data);
        else report.unreported.push(media);
      } catch { report.failed.push({ media, message: 'Could not check this show. Please try again.' }); }
    }
  }));
  report.events.sort((a, b) => a.date.localeCompare(b.date) || a.media.title.localeCompare(b.media.title));
  report.unreported.sort((a, b) => a.title.localeCompare(b.title));
  report.failed.sort((a, b) => a.media.title.localeCompare(b.media.title));
  return report;
}
