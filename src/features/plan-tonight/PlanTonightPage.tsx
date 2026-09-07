import { peopleOutline } from 'ionicons/icons';
import { Page } from '../../components/Page';
import { EmptyState } from '../../components/EmptyState';
export function PlanTonightPage() {
  return <Page title="Plan Tonight"><p className="eyebrow">GOOD COMPANY. GREAT STORIES.</p><h1>Make it a watch night.</h1>
    <EmptyState icon={peopleOutline} title="Find a pick for your people" description="Coming next: choose viewers, nominate titles, then vote or pick directly. Every plan will have a date; a time is up to you." />
    <p className="foundation-note">Local viewer profiles and optional voting are prepared in the data model.</p>
  </Page>;
}
