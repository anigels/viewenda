import { calendarOutline } from 'ionicons/icons';
import { Page } from '../../components/Page';
import { EmptyState } from '../../components/EmptyState';
export function MyWeekPage() {
  return <Page title="My Week"><p className="eyebrow">SOMETHING TO LOOK FORWARD TO</p><h1>A week worth watching.</h1>
    <EmptyState icon={calendarOutline} title="A little room for a good night" description="Your planned watch nights will appear here. Calendar planning is coming in a later phase." />
    <section className="quiet-section"><h2>Upcoming releases</h2><p>Separate from your plans. Future automatic events will appear only when reliable air or release dates are available. No estimated episode times.</p></section>
  </Page>;
}
