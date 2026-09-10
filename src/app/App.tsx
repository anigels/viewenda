import { IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { homeOutline, searchOutline, bookmarkOutline, peopleOutline, calendarOutline } from 'ionicons/icons';
import { ViewendaProvider } from './ViewendaProvider';
import { LocalViewendaRepository } from '../data/localViewendaRepository';
import { HomePage } from '../pages/HomePage';
import { SearchPage } from '../features/search/SearchPage';
import { WatchlistPage } from '../features/watchlist/WatchlistPage';
import { PlanTonightPage } from '../features/plan-tonight/PlanTonightPage';
import { MyWeekPage } from '../features/calendar/MyWeekPage';
import { ProfilePage } from '../features/onboarding/ProfilePage';
setupIonicReact();
const repository = new LocalViewendaRepository();
const tabs = [
  { path: '/home', label: 'Home', icon: homeOutline },
  { path: '/search', label: 'Search', icon: searchOutline },
  { path: '/watchlist', label: 'Watchlist', icon: bookmarkOutline },
  { path: '/plan-tonight', label: 'Tonight', icon: peopleOutline },
  { path: '/my-week', label: 'My Lineup', icon: calendarOutline },
];
export default function App() {
  return <IonApp><ViewendaProvider repository={repository}><IonReactRouter><IonTabs>
    <IonRouterOutlet>
      <Route exact path="/home" component={HomePage} />
      <Route exact path="/search" component={SearchPage} />
      <Route exact path="/watchlist" component={WatchlistPage} />
      <Route exact path="/plan-tonight" component={PlanTonightPage} />
      <Route exact path="/my-week" component={MyWeekPage} />
      <Route exact path="/profile" component={ProfilePage} />
      <Route exact path="/"><Redirect to="/home" /></Route>
      <Route><Redirect to="/home" /></Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom">{tabs.map(tab => <IonTabButton key={tab.path} tab={tab.path.slice(1)} href={tab.path}><IonIcon icon={tab.icon} /><IonLabel>{tab.label}</IonLabel></IonTabButton>)}</IonTabBar>
  </IonTabs></IonReactRouter></ViewendaProvider></IonApp>;
}
