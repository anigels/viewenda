import { useCallback, useState } from 'react';
import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import type { MediaReference } from '../../domain/models';
import { tmdb, posterUrl } from '../../services/tmdb';
import { useCue } from '../../hooks/useCue';
import { useRemote } from '../../hooks/useRemote';
import { RemoteFeedback } from '../../components/RemoteFeedback';
import { WatchlistControls } from '../watchlist/WatchlistControls';
import type { ProviderAvailability } from '../../services/tmdb/client';
const groups: [keyof Omit<ProviderAvailability, 'link'>, string][] = [['flatrate', 'Subscription'], ['free', 'Free'], ['ads', 'With ads'], ['rent', 'Rent'], ['buy', 'Buy']];
function Availability({ media, region, selected }: { media: MediaReference; region: string; selected: number[] }) {
  const loader = useCallback(() => tmdb.watchProviders(media, region), [media, region]);
  const result = useRemote(loader);
  const present = groups.filter(([key]) => result.data?.[key]?.length);
  return <section><h2>Where to watch · {region}</h2><RemoteFeedback {...result} />
    {!result.loading && !result.error && <>
      {present.length ? present.map(([key, label]) => <div key={key}><h3>{label}</h3><ul className="provider-tags">{result.data?.[key]?.map(provider => <li key={provider.provider_id}>{provider.provider_name}{selected.includes(provider.provider_id) && <span className="your-service">Your service</span>}</li>)}</ul></div>) : <p>No availability reported for this region. This does not confirm that the title is unavailable.</p>}
      {result.data?.link && <IonButton fill="outline" href={result.data.link} target="_blank" rel="noopener noreferrer">Watch options on TMDB</IonButton>}
    </>}
    <p className="attribution">Availability data by <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a> via TMDB. Offers may change; confirm with the provider. A selected service does not guarantee access.</p>
  </section>;
}
function DetailsContent({ media, onOverlayChange }: { media: MediaReference; onOverlayChange: (open: boolean) => void }) {
  const { data } = useCue();
  const loader = useCallback(() => tmdb.details(media), [media]);
  const result = useRemote(loader);
  const poster = posterUrl(media.posterPath, 'w500');
  return <div className="detail-content">
    <div className="detail-heading">{poster && <img className="detail-poster" src={poster} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />}<div><p className="eyebrow">{media.mediaType === 'tv' ? 'TV SHOW' : 'MOVIE'}</p><h1>{media.title}</h1></div></div>
    <RemoteFeedback {...result} />
    {result.data && <><p>{result.data.overview || 'No synopsis available.'}</p><p>{result.data.date ? 'First released: ' + result.data.date : 'Release date not reported.'}{result.data.runtime ? ' · ' + result.data.runtime + ' min' : ''}</p></>}
    <WatchlistControls media={media} onOverlayChange={onOverlayChange} />
    {data && <Availability media={media} region={data.profile.region} selected={data.profile.selectedProviderIds} />}
    <p className="attribution">Title information and artwork from <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>.</p>
  </div>;
}
export function MediaDetails({ media, onClose }: { media: MediaReference | null; onClose: () => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return <IonModal isOpen={!!media} canDismiss={!pickerOpen} onDidDismiss={() => { setPickerOpen(false); onClose(); }}><IonHeader><IonToolbar><IonTitle>Title details</IonTitle><IonButtons slot="end"><IonButton disabled={pickerOpen} onClick={onClose}>Done</IonButton></IonButtons></IonToolbar></IonHeader><IonContent>{media && <DetailsContent media={media} onOverlayChange={setPickerOpen} />}</IonContent></IonModal>;
}