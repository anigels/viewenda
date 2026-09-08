import { IonButton, IonSpinner } from '@ionic/react';
export function RemoteFeedback({ loading, error, retry }: { loading: boolean; error?: string; retry: () => void }) {
  if (loading) return <p className="loading-state" role="status"><IonSpinner name="dots" /> Loading…</p>;
  if (error) return <div className="notice" role="alert"><p>{error}</p><IonButton fill="outline" onClick={retry}>Try again</IonButton></div>;
  return null;
}