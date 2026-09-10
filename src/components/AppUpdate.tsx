/// <reference types="vite-plugin-pwa/react" />
import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function AppUpdate() {
  const { needRefresh: [available], updateServiceWorker } = useRegisterSW();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!available || dismissed) return null;
  return <aside className="app-update" aria-label="App update available">
    <p>A Viewenda update is ready. Save any open edits before reloading.</p>
    <IonButton disabled={busy} onClick={async () => {
      setBusy(true); setError('');
      try { await updateServiceWorker(true); }
      catch { setError('Could not update. Try again.'); }
      finally { setBusy(false); }
    }}>Update and reload</IonButton>
    <IonButton fill="clear" disabled={busy} onClick={() => setDismissed(true)}>Later</IonButton>
    {error && <p role="alert">{error}</p>}
  </aside>;
}
