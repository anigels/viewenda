import { useState } from 'react';
import { IonButton, IonSelect, IonSelectOption, IonToggle, useIonAlert } from '@ionic/react';
import { mediaId, watchStatuses, type MediaReference, type WatchStatus } from '../../domain/models';
import { addTitle, editTitle } from '../../domain/watchlist';
import { useCue } from '../../hooks/useCue';
export function WatchlistControls({ media, onOverlayChange }: { media: MediaReference; onOverlayChange?: (open: boolean) => void }) {
  const { data, updateWatchlist } = useCue();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [presentAlert] = useIonAlert();
  const item = data?.watchlist.find(item => mediaId(item.media) === mediaId(media));
  async function change(transform: Parameters<typeof updateWatchlist>[0]) {
    if (busy) return;
    setBusy(true); setError('');
    try { await updateWatchlist(transform); }
    catch { setError('Could not save this change. Your saved watchlist is unchanged. Try again.'); }
    finally { setBusy(false); }
  }
  return <div className="watchlist-controls" aria-label={'Watchlist settings for ' + media.title}>
    {item ? <>
      <IonSelect label="Watch status" aria-label={'Watch status for ' + media.title} value={item.status} disabled={busy} interface="action-sheet" onClick={() => { if (!busy) onOverlayChange?.(true); }} onIonDismiss={() => onOverlayChange?.(false)} onIonChange={e => {
        if (watchStatuses.includes(e.detail.value as WatchStatus)) void change(items => editTitle(items, media, { status: e.detail.value }));
      }}>{watchStatuses.map(status => <IonSelectOption key={status} value={status}>{status}</IonSelectOption>)}</IonSelect>
      <IonToggle checked={item.isFavorite} disabled={busy} onIonChange={e => void change(items => editTitle(items, media, { isFavorite: e.detail.checked }))}>Favorite</IonToggle>
      <IonButton fill="clear" color="medium" disabled={busy} onClick={() => void presentAlert({
        onWillPresent: () => onOverlayChange?.(true), onDidDismiss: () => onOverlayChange?.(false), header: 'Remove from watchlist?', message: 'This removes its saved status and favorite setting. You can add the title again later.',
        buttons: [{ text: 'Keep title', role: 'cancel' }, { text: 'Remove', role: 'destructive', handler: () => { void change(items => items.filter(item => mediaId(item.media) !== mediaId(media))); } }],
      })}>Remove title</IonButton>
    </> : <IonButton expand="block" disabled={!data || busy} onClick={() => void change(items => addTitle(items, media))}>{busy ? 'Saving…' : 'Add to watchlist'}</IonButton>}
    {error && <p role="alert">{error}</p>}
  </div>;
}