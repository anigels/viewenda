import { bookmarkOutline } from 'ionicons/icons';
import { Page } from '../../components/Page';
import { EmptyState } from '../../components/EmptyState';
export function WatchlistPage() {
  return <Page title="Watchlist"><p className="eyebrow">KEEP THE GOOD ONES CLOSE</p><h1>Your watchlist.</h1>
    <p className="lede">Movies and shows, at your pace. Favorites will stay independent of watch status.</p>
    <EmptyState icon={bookmarkOutline} title="Your next favorite belongs here" description="Saving titles and updating title-level progress are coming next." link="/search" action="Explore Search" />
  </Page>;
}
