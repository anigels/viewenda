import { useState } from 'react';
import { IonButton } from '@ionic/react';
import type { EpisodeReference, MediaReference } from '../domain/models';
import { episodeLabel } from '../domain/episodes';
import { localDate } from '../domain/planning';
import { useViewenda } from '../hooks/useViewenda';
import { saveManualPlan } from '../data/planningActions';
import { ScheduleFields } from './ScheduleFields';

export function EpisodePlan({ media, episode }: { media: MediaReference; episode: EpisodeReference }) {
  const { updatePlanning } = useViewenda();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return <div className="episode-plan">
    {!open ? <IonButton fill="outline" aria-label={'Plan ' + episodeLabel(episode) + ' of ' + media.title} onClick={() => { setDate(episode.airDate && episode.airDate >= localDate() ? episode.airDate : localDate()); setTime(''); setError(''); setMessage(''); setOpen(true); }}>Add to My Lineup</IonButton> : <form onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setError('');
      try { await updatePlanning(data => saveManualPlan(data, { id: crypto.randomUUID(), media: { ...media }, episode: { ...episode }, date, ...(time ? { optionalTime: time } : {}), source: 'manual' })); setMessage(episodeLabel(episode) + ' planned for ' + date + '.'); setOpen(false); }
      catch (error) { setError(error instanceof Error ? error.message : 'Could not save this plan. Try again.'); }
      finally { setBusy(false); }
    }}>
      <p>{episodeLabel(episode)}{episode.name ? ' · ' + episode.name : ''}</p>
      <p>Choose when you want to watch. A reported air date does not guarantee availability on your service.</p>
      <ScheduleFields date={date} time={time} onDate={setDate} onTime={setTime} disabled={busy} />
      <IonButton type="submit" disabled={busy}>Save episode plan</IonButton><IonButton fill="clear" disabled={busy} onClick={() => setOpen(false)}>Cancel</IonButton>
      {error && <p role="alert">{error}</p>}
    </form>}
    {message && <p role="status">{message}</p>}
  </div>;
}
