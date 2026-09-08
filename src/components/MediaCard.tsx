import { IonButton, IonCard, IonCardContent } from '@ionic/react';
import type { MediaReference } from '../domain/models';
import { posterUrl } from '../services/tmdb';
export function MediaCard({ media, onOpen }: { media: MediaReference; onOpen: () => void }) {
  const poster = posterUrl(media.posterPath);
  return <IonCard className="media-card"><IonCardContent>
    {poster ? <img className="poster" src={poster} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /> : <div className="poster poster-placeholder" aria-hidden="true">cue•</div>}
    <div className="media-copy"><p className="eyebrow">{media.mediaType === 'tv' ? 'TV SHOW' : 'MOVIE'}</p><h2>{media.title}</h2>
      <IonButton fill="clear" onClick={onOpen} aria-label={'View details for ' + media.title}>View details</IonButton>
    </div>
  </IonCardContent></IonCard>;
}