import { IonButton, IonCard, IonCardContent, IonIcon } from '@ionic/react';
export function EmptyState({ icon, title, description, link, action }: {
  icon: string; title: string; description: string; link?: string; action?: string;
}) {
  return <IonCard className="empty-card"><IonCardContent>
    <div className="empty-icon"><IonIcon icon={icon} aria-hidden="true" /></div>
    <h2>{title}</h2><p>{description}</p>
    {link && <IonButton routerLink={link}>{action}</IonButton>}
  </IonCardContent></IonCard>;
}
