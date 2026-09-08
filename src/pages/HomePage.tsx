import { IonButton, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { arrowForwardOutline, bookmarkOutline, calendarOutline } from 'ionicons/icons';
import { Page } from '../components/Page';
import { useCue } from '../hooks/useCue';
export function HomePage() {
  const { data } = useCue();
  return <Page title="Home">
    <p className="eyebrow">YOUR NEXT GOOD NIGHT IN</p>
    <h1>Less scrolling.<br /><span>More watching.</span></h1>
    <p className="lede">A little space for everything you want to watch, and everyone you watch with.</p>
    <IonCard className="hero-card"><IonCardContent>
      <p className="eyebrow">MAKE AN EVENING OF IT</p><h2>What’s the plan tonight?</h2>
      <p>Your next movie night starts here. Bring your people and find a shared pick.</p>
      <IonButton routerLink="/plan-tonight">Plan Tonight<IonIcon slot="end" icon={arrowForwardOutline} /></IonButton>
    </IonCardContent></IonCard>
    <div className="section-heading"><h2>Your Cue</h2><span>Your saved collection</span></div>
    <div className="card-grid">
      <IonCard routerLink="/watchlist"><IonCardContent><IonIcon icon={bookmarkOutline} /><h2>{data?.watchlist.length ?? 0} saved titles</h2><p>A home for your next great watch.</p></IonCardContent></IonCard>
      <IonCard routerLink="/my-week"><IonCardContent><IonIcon icon={calendarOutline} /><h2>{data?.watchPlans.length ?? 0} plans ahead</h2><p>Make room for a good story.</p></IonCardContent></IonCard>
    </div>
    <p className="foundation-note">PHASE 2 · Search & watchlist</p>
  </Page>;
}
