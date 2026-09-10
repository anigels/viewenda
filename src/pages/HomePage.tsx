import { IonButton, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { arrowForwardOutline, bookmarkOutline, calendarOutline } from 'ionicons/icons';
import { Page } from '../components/Page';
import { localDate } from '../domain/planning';
import { useViewenda } from '../hooks/useViewenda';
export function HomePage() {
  const { data } = useViewenda();
  return <Page title="Home">
    <p className="eyebrow">YOUR NEXT GOOD NIGHT IN</p>
    <h1>Less scrolling.<br /><span>More watching.</span></h1>
    <p className="lede">Your entertainment, all lined up.</p>
    <IonCard className="hero-card"><IonCardContent>
      <p className="eyebrow">MAKE AN EVENING OF IT</p><h2>What’s the plan tonight?</h2>
      <p>Your next movie night starts here. Bring your people and find a shared pick.</p>
      <IonButton routerLink="/plan-tonight">Plan Tonight<IonIcon slot="end" icon={arrowForwardOutline} /></IonButton>
    </IonCardContent></IonCard>
    <div className="section-heading"><h2>Your Viewenda</h2><span>Your saved collection</span></div>
    <div className="card-grid">
      <IonCard routerLink="/watchlist"><IonCardContent><IonIcon icon={bookmarkOutline} /><h2>{data?.watchlist.length ?? 0} saved titles</h2><p>A home for your next great watch.</p></IonCardContent></IonCard>
      <IonCard routerLink="/my-week"><IonCardContent><IonIcon icon={calendarOutline} /><h2>{data?.watchPlans.filter(plan => plan.date >= localDate()).length ?? 0} plans ahead</h2><p>Make room for a good story.</p></IonCardContent></IonCard>
    </div>
    <p className="foundation-note">PHASE 3 · Watch nights & weekly plans</p>
  </Page>;
}
