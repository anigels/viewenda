import { useEffect, useState } from 'react';
import { IonButton } from '@ionic/react';
import { Link } from 'react-router-dom';
import type { MediaReference } from '../../domain/models';
import { localDate, readableDate } from '../../domain/planning';
import { tmdb } from '../../services/tmdb';
import { loadUpcoming, type UpcomingReport } from '../../services/tmdb/upcoming';

export function UpcomingTv({ media, dates, onShowWeek }: { media: MediaReference[]; dates: string[]; onShowWeek: (date: string) => void }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; report: UpcomingReport }>();
  const today = localDate();
  // Status/favorite changes do not require another lookup; title changes still update the display.
  const shows = JSON.stringify(media.filter(item => item.mediaType === 'tv'));
  const key = shows + today + attempt;
  useEffect(() => {
    let cancelled = false;
    void loadUpcoming(JSON.parse(shows), today, tmdb, () => cancelled).then(report => {
      if (!cancelled) setResult({ key, report });
    });
    return () => { cancelled = true; };
  }, [shows, today, key]);
  const report = result?.key === key ? result.report : undefined;
  const inWeek = report?.events.filter(event => dates.includes(event.date)) ?? [];
  const elsewhere = report?.events.filter(event => !dates.includes(event.date)) ?? [];
  return <section className="quiet-section upcoming-tv" aria-labelledby="upcoming-tv-heading">
    <h2 id="upcoming-tv-heading">Upcoming TV air dates</h2>
    <p>Reported dates for your saved shows, separate from your viewing plans. These are not confirmed streaming release dates for your services or region. Dates may change; times are not supplied.</p>
    {shows === '[]' ? <p><Link to="/search">Save a TV show</Link> to see its next reported air date.</p> : <>
      <IonButton fill="outline" disabled={!report} onClick={() => setAttempt(value => value + 1)}>Refresh air dates</IonButton>
      {!report ? <p role="status">Checking saved shows…</p> : <>
        <h3>In the selected week</h3>
        {!inWeek.length && <p>No upcoming air dates reported for this week in the shows checked successfully.</p>}
        {inWeek.map(event => <article className="plan-entry" key={event.media.tmdbId}>
          <p className="eyebrow">{readableDate(event.date)}, {event.date.slice(0, 4)} · {event.eventType === 'premiere' ? 'SERIES PREMIERE' : 'NEXT EPISODE'}</p>
          <h4>{event.media.title}</h4>
          {event.episode && <p>Season {event.episode.season} · Episode {event.episode.number}</p>}
          <a href={'https://www.themoviedb.org/tv/' + event.media.tmdbId} target="_blank" rel="noreferrer">Check on TMDB</a>
        </article>)}
        {!!elsewhere.length && <details><summary>Reported dates outside this week ({elsewhere.length})</summary>{elsewhere.map(event => <p key={event.media.tmdbId}>{event.media.title} · {readableDate(event.date)}, {event.date.slice(0, 4)} <IonButton fill="clear" aria-label={'Show week for ' + event.media.title} onClick={() => onShowWeek(event.date)}>Show week</IonButton></p>)}</details>}
        {!!report.unreported.length && <details><summary>No upcoming date reported ({report.unreported.length})</summary><ul>{report.unreported.map(show => <li key={show.tmdbId}>{show.title}</li>)}</ul><p>This does not mean a show has ended.</p></details>}
        {!!report.failed.length && <div className="notice" role="alert"><p>Could not check {report.failed.length} saved {report.failed.length === 1 ? 'show' : 'shows'}. Other reported dates are still shown. Use Refresh air dates to retry.</p><details><summary>Shows not checked</summary><ul>{report.failed.map(({ media, message }) => <li key={media.tmdbId}>{media.title}: {message}</li>)}</ul></details></div>}
        <p className="attribution">Air-date data from TMDB. Only the next reported episode or series premiere is shown, not a complete episode calendar. Refresh to check for changes.</p>
      </>}
    </>}
  </section>;
}
