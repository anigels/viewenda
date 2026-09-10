import type { EpisodePosition, EpisodeReference } from '../../domain/models';
import { afterEpisode } from '../../domain/episodes';
import type { TmdbClient, TmdbResult } from './client';
/** Walk reported regular seasons in order, stopping on failure rather than skipping unseen episodes. */
export async function nextToWatch(id: number, last: EpisodePosition | null, client: Pick<TmdbClient, 'tvSeasons' | 'seasonEpisodes'>): Promise<TmdbResult<EpisodeReference | null>> {
  const seasons = await client.tvSeasons(id);
  if (!seasons.ok) return seasons;
  if (last && !seasons.data.includes(last.season)) return { ok: false, error: { kind: 'response', message: 'Your saved season is no longer listed. Review your episode progress.' } };
  for (const season of seasons.data.filter(n => !last || n >= last.season)) {
    const episodes = await client.seasonEpisodes(id, season);
    if (!episodes.ok) return episodes;
    if (last?.season === season && !episodes.data.some(e => e.number === last.number)) return { ok: false, error: { kind: 'response', message: 'Your saved episode is no longer listed. Review your episode progress.' } };
    const next = episodes.data.find(e => afterEpisode(e, last));
    if (next) return { ok: true, data: next };
  }
  return { ok: true, data: null };
}
