import { useState } from 'react';
import { IonButton, IonCheckbox, IonInput, IonItem, IonList, IonSearchbar, useIonAlert } from '@ionic/react';
import { Link } from 'react-router-dom';
import { Page } from '../../components/Page';
import { ScheduleFields } from '../../components/ScheduleFields';
import { useViewenda } from '../../hooks/useViewenda';
import { allViewers, currentNight, cleanNight, changeNight, startNight, addViewer, removeViewer, scheduleNight } from '../../data/planningActions';
import { castVote, localDate, tallyVotes } from '../../domain/planning';
import { mediaId, type MediaId, type WatchNight } from '../../domain/models';
import type { ViewendaData } from '../../data/ViewendaRepository';

export function PlanTonightPage() {
  const { data, updatePlanning } = useViewenda();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState(localDate);
  const [time, setTime] = useState('');
  const [showVoting, setShowVoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [presentAlert] = useIonAlert();
  async function run(action: (data: ViewendaData) => ViewendaData) {
    if (busy) return false;
    setBusy(true); setError('');
    try { await updatePlanning(action); return true; }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Try again.'); return false; }
    finally { setBusy(false); }
  }
  const stored = data && currentNight(data);
  const night = stored && data ? cleanNight(data, stored) : null;
  const viewers = data ? allViewers(data) : [];
  const nominees = data?.watchlist.filter(item => night?.nomineeMediaIds.includes(mediaId(item.media))) ?? [];
  const tallies = night ? tallyVotes(night) : [];
  const highest = Math.max(0, ...tallies.map(tally => tally.count));
  const tied = highest > 0 && tallies.filter(tally => tally.count === highest).length > 1;
  function change(transform: (night: WatchNight) => WatchNight) { if (night) void run(data => changeNight(data, night.id, transform)); }
  return <Page title="Plan Tonight"><p className="eyebrow">GOOD COMPANY. GREAT STORIES.</p><h1>Make it a watch night.</h1>
    <p className="lede">A shared pick, without the endless debate. Plan on this device and pass it around if you want to vote.</p>
    {error && <p className="notice" role="alert">{error}</p>}
    {saved && <p className="notice" role="status">{saved} <Link to="/my-week">See My Lineup</Link></p>}
    {!data ? <p>Waiting for your local data…</p> : !night ? <section className="planning-panel"><h2>Who’s watching tonight?</h2><p>Start a night, choose people and nominate titles from your watchlist. Voting is optional.</p><IonButton disabled={busy} onClick={() => { setSaved(''); setDate(localDate()); setTime(''); setShowVoting(false); void run(data => startNight(data, crypto.randomUUID())); }}>Start a watch night</IonButton></section> : <>
      <p className="draft-note">Your viewers, nominations, votes and chosen title are saved as you go. Set the date and optional time when you’re ready.</p>
      <section className="planning-panel"><h2>1. Who’s joining?</h2>
        <IonList>{viewers.map(viewer => <IonItem key={viewer.id}><IonCheckbox disabled={busy} checked={night.viewerIds.includes(viewer.id)} onIonChange={event => change(night => ({ ...night, viewerIds: event.detail.checked ? [...night.viewerIds, viewer.id] : night.viewerIds.filter(id => id !== viewer.id) }))}>{viewer.name}{viewer.id === data.profile.id ? ' (you)' : ''}</IonCheckbox>{viewer.id !== data.profile.id && <IonButton slot="end" fill="clear" color="medium" disabled={busy} aria-label={'Remove viewer ' + viewer.name} onClick={() => void presentAlert({ header: 'Remove viewer?', message: 'Their participation and votes will be removed from the current draft.', buttons: [{ text: 'Keep viewer', role: 'cancel' }, { text: 'Remove viewer', role: 'destructive', handler: () => { void run(data => removeViewer(data, viewer.id)); } }] })}>Remove</IonButton>}</IonItem>)}</IonList>
        <form className="viewer-form" onSubmit={async event => { event.preventDefault(); const id = crypto.randomUUID(); const added = await run(data => { const next = addViewer(data, id, name); return changeNight(next, night.id, night => ({ ...night, viewerIds: [...night.viewerIds, id] })); }); if (added) setName(''); }}><IonInput label="New viewer name" labelPlacement="stacked" maxlength={40} value={name} disabled={busy} onIonInput={e => setName(e.detail.value ?? '')} /><IonButton type="submit" disabled={busy || !name.trim()}>Add viewer</IonButton></form>
        {!night.viewerIds.length && <p>Choose at least one viewer, including yourself for a solo night.</p>}
      </section>
      <section className="planning-panel"><h2>2. What’s on the shortlist?</h2>
        {!data.watchlist.length ? <p>Your watchlist is empty. <Link to="/search">Find and save a title</Link>, then come back to this night.</p> : <><IonSearchbar aria-label="Find nominees in your watchlist" placeholder="Find a saved title" value={query} onIonInput={e => setQuery(e.detail.value ?? '')} /><IonList className="nominee-list">{data.watchlist.filter(item => item.media.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).map(item => <IonItem key={mediaId(item.media)}><IonCheckbox disabled={busy} checked={night.nomineeMediaIds.includes(mediaId(item.media))} onIonChange={event => change(night => ({ ...night, nomineeMediaIds: event.detail.checked ? [...night.nomineeMediaIds, mediaId(item.media)] : night.nomineeMediaIds.filter(id => id !== mediaId(item.media)) }))}><span>{item.media.title}<small className="choice-meta">{item.media.mediaType === 'tv' ? 'TV show' : 'Movie'} · {item.status}</small></span></IonCheckbox></IonItem>)}</IonList><p>{nominees.length} nominated</p></>}
      </section>
      {!!nominees.length && <section className="planning-panel"><h2>3. Pick a title</h2><p>Choose directly below, or take a vote first. Everyone can choose one preferred title; you can skip voting at any time.</p>
        <IonButton fill="outline" disabled={busy} onClick={() => setShowVoting(value => !value)}>{showVoting ? 'Hide voting' : 'Vote together (optional)'}</IonButton>
        {showVoting && <div className="voting-panel">{viewers.filter(viewer => night.viewerIds.includes(viewer.id)).map(viewer => <label className="native-field" key={viewer.id}><span>Vote for {viewer.name}</span><select aria-label={'Vote for ' + viewer.name} disabled={busy} value={night.votes.find(vote => vote.viewerId === viewer.id)?.mediaId ?? ''} onChange={event => { const choice = event.target.value as MediaId | ''; change(night => castVote(night, viewer.id, choice || null)); }}><option value="">No vote</option>{nominees.map(item => <option key={mediaId(item.media)} value={mediaId(item.media)}>{item.media.title} ({item.media.mediaType === 'tv' ? 'TV' : 'Movie'})</option>)}</select></label>)}<p>{night.votes.length} of {night.viewerIds.length} votes recorded.{tied ? ' It’s a tie—choose any title below.' : ' The final choice is yours.'}</p></div>}
        <fieldset className="title-choices"><legend>Tonight’s pick</legend>{nominees.map(item => <label key={mediaId(item.media)}><input type="radio" name="tonight-pick" disabled={busy} checked={night.selectedMediaId === mediaId(item.media)} onChange={() => change(night => ({ ...night, selectedMediaId: mediaId(item.media) }))} /><span>{item.media.title}<small className="choice-meta">{item.media.mediaType === 'tv' ? 'TV show' : 'Movie'} · {tallies.find(tally => tally.id === mediaId(item.media))?.count ?? 0} votes</small></span></label>)}</fieldset>
      </section>}
      <section className="planning-panel"><h2>4. Make room for it</h2><form onSubmit={async event => { event.preventDefault(); const success = await run(data => scheduleNight(data, night.id, crypto.randomUUID(), date, time)); if (success) { setSaved('Watch night saved for ' + date + '.'); setShowVoting(false); } }}><ScheduleFields date={date} time={time} onDate={setDate} onTime={setTime} disabled={busy} /><p>Time is optional. Your plan is independent of air dates and does not change your watch status.</p><IonButton type="submit" expand="block" disabled={busy || !night.selectedMediaId || !night.viewerIds.length}>{busy ? 'Saving…' : 'Save watch night'}</IonButton></form></section>
      <IonButton fill="clear" color="medium" disabled={busy} onClick={() => void presentAlert({ header: 'Discard this draft?', message: 'Its nominations and votes will be removed. Your viewers and watchlist stay saved.', buttons: [{ text: 'Keep draft', role: 'cancel' }, { text: 'Discard draft', role: 'destructive', handler: () => { void run(data => ({ ...data, watchNights: data.watchNights.filter(item => item.id !== night.id) })); } }] })}>Discard draft</IonButton>
    </>}
  </Page>;
}
