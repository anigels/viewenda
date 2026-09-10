import { CompleteEpisode } from '../../components/CompleteEpisode';
import { episodeLabel } from '../../domain/episodes';
import { UpcomingTv } from './UpcomingTv';
import { useState } from 'react';
import { IonButton, useIonAlert } from '@ionic/react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { ScheduleFields } from '../../components/ScheduleFields';
import { useViewenda } from '../../hooks/useViewenda';
import { localDate, addDays, weekDates, readableDate, readableTime, sortPlans, validDate } from '../../domain/planning';
import { mediaId, type WatchPlan } from '../../domain/models';
import { saveManualPlan, reschedulePlan, removePlan } from '../../data/planningActions';
import type { ViewendaData } from '../../data/ViewendaRepository';

function PlanEditor({ plan, busy, onSave, onCancel }: { plan: WatchPlan; busy: boolean; onSave: (date: string, time: string) => Promise<boolean>; onCancel: () => void }) {
  const [date, setDate] = useState(plan.date);
  const [time, setTime] = useState(plan.optionalTime ?? '');
  return <form onSubmit={async event => { event.preventDefault(); if (await onSave(date, time)) onCancel(); }}><ScheduleFields date={date} time={time} onDate={setDate} onTime={setTime} disabled={busy} /><IonButton type="submit" disabled={busy}>Save changes</IonButton><IonButton fill="clear" disabled={busy} onClick={onCancel}>Cancel</IonButton></form>;
}
export function MyWeekPage() {
  const { data, updatePlanning } = useViewenda();
  const [anchor, setAnchor] = useState(localDate);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState(localDate);
  const [time, setTime] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [presentAlert] = useIonAlert();
  const dates = weekDates(anchor);
  const plans = sortPlans(data?.watchPlans ?? []);
  async function run(action: (data: ViewendaData) => ViewendaData) {
    if (busy) return false;
    setBusy(true); setError(''); setMessage('');
    try { await updatePlanning(action); return true; }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Try again.'); return false; }
    finally { setBusy(false); }
  }
  return <Page title="My Lineup"><p className="eyebrow">SOMETHING TO LOOK FORWARD TO</p><h1>A week worth watching.</h1><p className="lede">Your plans, at your pace. Schedule a saved title or <Link to="/plan-tonight">plan a night together</Link>.</p>
    {error && <p className="notice" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <IonButton disabled={!data || busy} onClick={() => { setAdding(value => !value); setEditing(null); }}>{adding ? 'Close new plan' : 'Add a plan'}</IonButton>
    {adding && data && <section className="planning-panel"><h2>Plan a saved title</h2>{!data.watchlist.length ? <p><Link to="/search">Add a title to your watchlist</Link> to make a plan.</p> : <form onSubmit={async event => {
      event.preventDefault(); const media = data.watchlist.find(item => mediaId(item.media) === selected)?.media;
      if (!media) { setError('Choose a saved title.'); return; }
      if (await run(data => saveManualPlan(data, { id: crypto.randomUUID(), media: { ...media }, date, ...(time ? { optionalTime: time } : {}), source: 'manual' }))) { setAdding(false); setAnchor(date); setSelected(''); setTime(''); setMessage('Plan saved.'); }
    }}><label className="native-field"><span>Title to plan</span><select required disabled={busy} value={selected} onChange={event => setSelected(event.target.value)}><option value="">Choose a saved title</option>{data.watchlist.map(item => <option key={mediaId(item.media)} value={mediaId(item.media)}>{item.media.title} ({item.media.mediaType === 'tv' ? 'TV' : 'Movie'})</option>)}</select></label><ScheduleFields date={date} time={time} onDate={setDate} onTime={setTime} disabled={busy} /><IonButton type="submit" disabled={busy || !selected}>Save plan</IonButton></form>}</section>}
    <nav className="week-navigation" aria-label="Browse weeks"><IonButton fill="outline" disabled={busy} onClick={() => { setAnchor(addDays(anchor, -7)); setEditing(null); }}>Previous week</IonButton><IonButton fill="clear" disabled={busy} onClick={() => { setAnchor(localDate()); setEditing(null); }}>This week</IonButton><IonButton fill="outline" disabled={busy} onClick={() => { setAnchor(addDays(anchor, 7)); setEditing(null); }}>Next week</IonButton></nav>
    <label className="native-field week-jump"><span>Week containing</span><input type="date" value={anchor} disabled={busy} onChange={event => { if (validDate(event.target.value)) { setAnchor(event.target.value); setEditing(null); } }} /></label>
    <h2>{readableDate(dates[0])} – {readableDate(dates[6])}</h2>
    {!data ? <p>Waiting for your saved plans…</p> : <>{!plans.some(plan => dates.includes(plan.date)) && <p className="notice">No plans this week. Add one above or choose a title in Plan Tonight.</p>}
      <div className="week-agenda">{dates.map(day => <section className="agenda-day" key={day}><h3>{readableDate(day)}{day === localDate() && <span className="today-badge">Today</span>}</h3>
        {!plans.some(plan => plan.date === day) && <p className="free-evening">Nothing planned.</p>}
        {plans.filter(plan => plan.date === day).map(plan => <article className="plan-entry" key={plan.id}><p className="eyebrow">{plan.optionalTime ? readableTime(plan.optionalTime) : 'TIME NOT SET'} · {plan.source === 'planTonight' ? 'PLAN TONIGHT' : 'MANUAL PLAN'}</p><h4>{plan.media.title}</h4>{plan.episode && <p>{episodeLabel(plan.episode)}{plan.episode.name ? ' · ' + plan.episode.name : ''}</p>}<p>{plan.media.mediaType === 'tv' ? 'TV show' : 'Movie'}</p>
          {plan.episode && <CompleteEpisode media={plan.media} episode={plan.episode} />}{editing === plan.id ? <PlanEditor plan={plan} busy={busy} onCancel={() => setEditing(null)} onSave={async (date, time) => { const success = await run(data => reschedulePlan(data, plan.id, date, time)); if (success) { setAnchor(date); setMessage('Plan updated.'); } return success; }} /> : <><IonButton fill="clear" disabled={busy} aria-label={'Edit plan for ' + plan.media.title + (plan.episode ? ' ' + episodeLabel(plan.episode) : '') + ' on ' + plan.date} onClick={() => { setEditing(plan.id); setAdding(false); }}>Edit date / time</IonButton><IonButton fill="clear" color="medium" disabled={busy} aria-label={'Remove plan for ' + plan.media.title + (plan.episode ? ' ' + episodeLabel(plan.episode) : '') + ' on ' + plan.date} onClick={() => void presentAlert({ header: 'Remove this plan?', message: 'The scheduled plan and its linked watch-night record will be removed. Your watchlist stays saved.', buttons: [{ text: 'Keep plan', role: 'cancel' }, { text: 'Remove plan', role: 'destructive', handler: () => { void run(data => removePlan(data, plan.id)).then(success => { if (success) setMessage('Plan removed.'); }); } }] })}>Remove</IonButton></>}
        </article>)}
      </section>)}</div>
    </>}
    {data && <UpcomingTv items={data.watchlist} media={data.watchlist.map(item => item.media)} dates={dates} onShowWeek={date => { setAnchor(date); setEditing(null); }} />}
  </Page>;
}
