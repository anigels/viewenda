import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import type { ReactNode } from 'react';
import { useCue } from '../hooks/useCue';

export function Page({ title, children }: { title: string; children: ReactNode }) {
  const { error } = useCue();
  return <IonPage>
    <IonHeader><IonToolbar><IonTitle><span className="wordmark">cue<span>•</span></span><span className="toolbar-title">{title}</span></IonTitle>
      <IonButtons slot="end"><IonButton routerLink="/profile" aria-label="Services and profile"><IonIcon slot="icon-only" icon={personCircleOutline} /></IonButton></IonButtons>
    </IonToolbar></IonHeader>
    <IonContent fullscreen><main className="page-content">{error && <p className="notice" role="alert">{error}</p>}{children}</main></IonContent>
  </IonPage>;
}
