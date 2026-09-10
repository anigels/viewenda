import { useCallback, useState } from 'react';
import { IonButton } from '@ionic/react';
import type { EpisodePosition, MediaReference, WatchlistItem } from '../../domain/models';
import { episodeLabel, saveProgress } from '../../domain/episodes';
import { localDate } from '../../domain/planning';
import { tmdb } from '../../services/tmdb';
import { nextToWatch } from '../../services/tmdb/nextToWatch';
import { useRemote } from '../../hooks/useRemote';
import { useViewenda } from '../../hooks/useViewenda';
import { RemoteFeedback } from '../../components/RemoteFeedback';
import { EpisodePlan } from '../../components/EpisodePlan';

function NextEpisode({ item }: { item: WatchlistItem }) {
  const last = item.lastCompletedEpisode;
  const loader = useCallback(() => nextToWatch(item.media.tmdbId, last ?? null, tmdb), [item.media.tmdbId, last?.season, last?.number]);
  const result = useRemote(loader);
  return <section><h3>Next to watch</h3><RemoteFeedback {...result} />
    {result.data === null && <p>No later episode is currently listed. This does not mean the series has ended.</p>}
    {result.data && <><p>{episodeLabel(result.data)}{result.data.name ? ' · ' + result.data.name : ''}</p>
      <p>{result.data.airDate ? (result.data.airDate > localDate() ? 'Upcoming air date: ' : 'Reported air date: ') + result.data.airDate : 'Air date not reported.'}</p>
      <EpisodePlan key={result.data.season + ':' + result.data.number} media={item.media} episode={result.data} /></>}
  </section>;
}
function SeasonProgress({ media, season, busy, onSave }: { media: MediaReference; season: number; busy: boolean; onSave: (last: EpisodePosition | null) => Promise<void> }) {
  const loader = useCallback(() => tmdb.seasonEpisodes(media.tmdbId, season), [media.tmdbId, season]);
  const result = useRemote(loader);
  const [selected, setSelected] = useState('');
  return <><RemoteFeedback {...result} />{result.data && <>
    {!result.data.length ? <p>No episodes are listed for this season yet.</p> : <>
      <label className="native-field"><span>Last episode completed</span><select value={selected} disabled={busy} onChange={e => setSelected(e.target.value)}><option value="">Choose an episode</option>{result.data.map(episode => <option value={episode.number} key={episode.number}>Episode {episode.number}{episode.name ? ' · ' + episode.name : ''}</option>)}</select></label>
      <p>Earlier regular episodes are treated as completed. This does not change your watch status.</p>
      <IonButton disabled={busy || !selected} onClick={() => { const episode = result.data?.find(e => e.number === Number(selected)); if (episode) void onSave({ season, number: episode.number }); }}>Save episode progress</IonButton>
      <details><summary>Browse season {season} episodes</summary>{result.data.map(episode => <article className="plan-entry" key={episode.number}><h4>{episodeLabel(episode)}</h4>{episode.name && <p>{episode.name}</p>}<p>{episode.airDate ? 'Reported air date: ' + episode.airDate : 'Air date not reported.'}</p><EpisodePlan media={media} episode={episode} /></article>)}</details>
    </>}
  </>}</>;
}
function ProgressEditor({ item }: { item: WatchlistItem }) {
  const { updateWatchlist } = useViewenda();
  const loader = useCallback(() => tmdb.tvSeasons(item.media.tmdbId), [item.media.tmdbId]);
  const result = useRemote(loader);
  const [season, setSeason] = useState(item.lastCompletedEpisode?.season ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const selectedSeason = result.data?.includes(season) ? season : result.data?.[0];
  async function save(last: EpisodePosition | null) {
    if (busy) return; setBusy(true); setError(''); setSaved('');
    try { await updateWatchlist(items => saveProgress(items, item.media, last)); setSaved('Episode progress saved.'); }
    catch { setError('Could not save progress. Your previous progress is unchanged. Try again.'); }
    finally { setBusy(false); }
  }
  return <div className="episode-progress">
    <p>Track regular episodes in order. Specials and out-of-order completion are not included.</p>
    <IonButton fill="clear" disabled={busy} onClick={() => void save(null)}>Set as not started</IonButton>
    {error && <p role="alert">{error}</p>}{saved && <p role="status">{saved}</p>}
    {item.lastCompletedEpisode !== undefined && <NextEpisode item={item} />}
    <RemoteFeedback {...result} />
    {result.data && !result.data.length && <p>No regular seasons are listed yet.</p>}
    {!!result.data?.length && <><label className="native-field"><span>Season to browse</span><select disabled={busy} value={selectedSeason} onChange={e => setSeason(Number(e.target.value))}>{result.data.map(number => <option key={number} value={number}>Season {number}</option>)}</select></label>
      {selectedSeason && <SeasonProgress key={selectedSeason} media={item.media} season={selectedSeason} busy={busy} onSave={save} />}
    </>}
    <p className="attribution">Episode data from TMDB. Air dates can change and may differ from streaming availability.</p>
  </div>;
}
export function EpisodeProgress({ item }: { item: WatchlistItem }) {
  const [open, setOpen] = useState(false);
  return <section className="episode-progress"><p>{item.lastCompletedEpisode === undefined ? 'Episode progress not set' : item.lastCompletedEpisode === null ? 'Not started' : 'Last completed: ' + episodeLabel(item.lastCompletedEpisode)}</p>
    <IonButton fill="outline" onClick={() => setOpen(value => !value)}>{open ? 'Hide episodes' : 'Episodes & progress'}</IonButton>
    {open && <ProgressEditor item={item} />}
  </section>;
}
