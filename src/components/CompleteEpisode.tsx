import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { mediaId, type EpisodeReference, type MediaReference } from '../domain/models';
import { afterEpisode, completeEpisode, episodeLabel } from '../domain/episodes';
import { useViewenda } from '../hooks/useViewenda';

export function CompleteEpisode({ media, episode }: { media: MediaReference; episode: EpisodeReference }) {
  const { data, updateWatchlist } = useViewenda();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const item = data?.watchlist.find(item => mediaId(item.media) === mediaId(media));
  if (!item) return null;
  if (item.lastCompletedEpisode && !afterEpisode(episode, item.lastCompletedEpisode)) return <p className="today-badge">Watched</p>;
  return <div>
    {!confirming ? <IonButton fill="outline" aria-label={'Mark ' + episodeLabel(episode) + ' of ' + media.title + ' watched'} onClick={() => setConfirming(true)}>Mark watched</IonButton> : <>
      <p>Mark this and all earlier regular episodes as watched? Your plans and show status stay as they are.</p>
      <IonButton disabled={busy} onClick={async () => {
        if (busy) return;
        setBusy(true); setError('');
        try { await updateWatchlist(items => completeEpisode(items, media, episode)); setConfirming(false); }
        catch { setError('Could not save progress. Try again.'); }
        finally { setBusy(false); }
      }}>Confirm watched</IonButton>
      <IonButton fill="clear" disabled={busy} onClick={() => { setConfirming(false); setError(''); }}>Cancel</IonButton>
    </>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
