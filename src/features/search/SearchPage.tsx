import { Link } from 'react-router-dom';
import { IonButton, IonSearchbar } from '@ionic/react';
import { searchOutline } from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { Page } from '../../components/Page';
import { EmptyState } from '../../components/EmptyState';
import { MediaCard } from '../../components/MediaCard';
import { RemoteFeedback } from '../../components/RemoteFeedback';
import { useRemote } from '../../hooks/useRemote';
import { tmdb } from '../../services/tmdb';
import { mediaId, type MediaReference } from '../../domain/models';
import { MediaDetails } from './MediaDetails';
import { CardAvailability } from './CardAvailability';
import { useCue } from '../../hooks/useCue';
function Results({ query, open }: { query: string; open: (media: MediaReference) => void }) {
  const { data } = useCue();
  const [page, setPage] = useState(1);
  const loader = useCallback(() => tmdb.multiSearch(query, page), [query, page]);
  const result = useRemote(loader);
  return <><RemoteFeedback {...result} />{result.data && <>
    {result.data.results.length ? <div className="results-grid search-results">{result.data.results.map(media => <MediaCard key={mediaId(media)} media={media} onOpen={() => open(media)}>{data && <CardAvailability media={media} region={data.profile.region} selected={data.profile.selectedProviderIds} />}</MediaCard>)}</div> : <EmptyState icon={searchOutline} title="No movies or shows on this page" description="Try another title or spelling. People are excluded from results." />}
    <nav className="pagination" aria-label="Search result pages"><IonButton fill="outline" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</IonButton><span>Page {page} of {Math.max(1, Math.min(500, result.data.totalPages))}</span><IonButton fill="outline" disabled={page >= Math.min(500, result.data.totalPages)} onClick={() => setPage(value => value + 1)}>Next</IonButton></nav>
  </>}</>;
}
export function SearchPage() {
  const { data } = useCue();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<MediaReference | null>(null);
  useEffect(() => { const timer = setTimeout(() => setDebounced(query.trim()), 350); return () => clearTimeout(timer); }, [query]);
  return <Page title="Search"><p className="eyebrow">FIND YOUR NEXT FAVORITE</p><h1>What’s on your mind?</h1>
    <IonSearchbar aria-label="Search movies and shows" value={query} onIonInput={event => setQuery(event.detail.value ?? '')} placeholder="Movies, shows, something good…" />
    {data && <p className="search-region">Streaming availability · {data.profile.region} · <Link to="/profile">Change region or services</Link></p>}
    {query.trim() !== debounced ? <p role="status">Updating search…</p> : debounced ? <Results key={debounced} query={debounced} open={setSelected} /> : <EmptyState icon={searchOutline} title="A world of stories awaits" description="Search for a movie or show, check its streaming options, and save it for later." />}
    <p className="attribution">Availability by <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a> via TMDB. Offers may change. Rentals and purchases cost extra; selected services do not guarantee access.</p>
    <MediaDetails media={selected} onClose={() => setSelected(null)} />
  </Page>;
}
