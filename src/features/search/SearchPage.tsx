import { IonSearchbar } from '@ionic/react';
import { searchOutline } from 'ionicons/icons';
import { useState } from 'react';
import { Page } from '../../components/Page';
import { EmptyState } from '../../components/EmptyState';
export function SearchPage() {
  const [query, setQuery] = useState('');
  return <Page title="Search"><p className="eyebrow">FIND YOUR NEXT FAVORITE</p><h1>What’s on your mind?</h1>
    <IonSearchbar aria-label="Search movies and shows" value={query} onIonInput={event => setQuery(event.detail.value ?? '')} placeholder="Movies, shows, something good…" />
    <EmptyState icon={searchOutline} title={query ? 'Search is coming next' : 'A world of stories awaits'} description="The TMDB connection is prepared. Live search and availability results will arrive in the next phase." />
  </Page>;
}
