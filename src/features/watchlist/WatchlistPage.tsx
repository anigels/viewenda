import { useState } from 'react';
import { IonSearchbar, IonSelect, IonSelectOption, IonToggle } from '@ionic/react';
import { bookmarkOutline } from 'ionicons/icons';
import { Page } from '../../components/Page';
import { EmptyState } from '../../components/EmptyState';
import { MediaCard } from '../../components/MediaCard';
import { MediaDetails } from '../search/MediaDetails';
import { WatchlistControls } from './WatchlistControls';
import { useViewenda } from '../../hooks/useViewenda';
import { mediaId, watchStatuses, type MediaReference, type WatchStatus } from '../../domain/models';
import { filterTitles } from '../../domain/watchlist';
export function WatchlistPage() {
  const { data } = useViewenda();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<WatchStatus | 'all'>('all');
  const [favorites, setFavorites] = useState(false);
  const [selected, setSelected] = useState<MediaReference | null>(null);
  const items = filterTitles(data?.watchlist ?? [], query, status, favorites);
  return <Page title="Watchlist"><p className="eyebrow">KEEP THE GOOD ONES CLOSE</p><h1>Your watchlist.</h1>
    {!data ? <p role="status">Waiting for your saved data…</p> : !data.watchlist.length ? <EmptyState icon={bookmarkOutline} title="Your next favorite belongs here" description="Find something good and save it for later." link="/search" action="Find a title" /> : <>
      <div className="watchlist-filters"><IonSearchbar aria-label="Search your watchlist" value={query} onIonInput={e => setQuery(e.detail.value ?? '')} placeholder="Find a saved title" />
        <IonSelect label="Filter by status" value={status} onIonChange={e => setStatus(e.detail.value)}><IonSelectOption value="all">All statuses</IonSelectOption>{watchStatuses.map(value => <IonSelectOption key={value} value={value}>{value}</IonSelectOption>)}</IonSelect>
        <IonToggle checked={favorites} onIonChange={e => setFavorites(e.detail.checked)}>Favorites only</IonToggle></div>
      <p role="status">{items.length} {items.length === 1 ? 'title' : 'titles'}</p>
      {!items.length && <p>No titles match these filters. Try another status or turn off Favorites only.</p>}
      <div className="results-grid">{items.map(item => <section className="saved-title" key={mediaId(item.media)}><MediaCard media={item.media} onOpen={() => setSelected(item.media)} /><WatchlistControls media={item.media} /></section>)}</div>
    </>}
    <MediaDetails media={selected} onClose={() => setSelected(null)} />
  </Page>;
}