import { useEffect, useState } from 'react';
import { IonButton, IonInput, IonItem, IonList } from '@ionic/react';
import { Page } from '../../components/Page';
import { useCue } from '../../hooks/useCue';
export function ProfilePage() {
  const { data, saveProfile } = useCue();
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) { setName(data.profile.name); setRegion(data.profile.region); } }, [data]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!data || saving) return;
    if (!name.trim() || !/^[A-Z]{2}$/.test(region.trim().toUpperCase())) {
      setMessage('Enter a name and a two-letter region code, such as US.'); return;
    }
    setSaving(true); setMessage('');
    try { await saveProfile({ ...data.profile, name: name.trim(), region: region.trim().toUpperCase() }); setMessage('Profile saved on this device.'); }
    catch { setMessage('Could not save. Check browser storage access and try again.'); }
    finally { setSaving(false); }
  }
  return <Page title="Services / Profile"><p className="eyebrow">MAKE CUE YOURS</p><h1>Your corner of Cue.</h1>
    <p className="lede">One primary profile, saved on this device. No sign-in needed.</p>
    <form onSubmit={save}>
      <IonList inset><IonItem><IonInput label="Profile name" labelPlacement="stacked" value={name} maxlength={80} autocomplete="nickname" onIonInput={e => setName(e.detail.value ?? '')} required /></IonItem>
        <IonItem><IonInput label="Region code" labelPlacement="stacked" helperText="Two-letter country code. Used for streaming availability." value={region} maxlength={2} autocapitalize="characters" onIonInput={e => setRegion(e.detail.value ?? '')} required /></IonItem></IonList>
      <IonButton type="submit" expand="block" disabled={!data || saving}>{saving ? 'Saving…' : 'Save profile'}</IonButton>
      <p role="status" aria-live="polite">{message}</p>
    </form>
    <section className="quiet-section"><h2>Your streaming services</h2><p>Provider selection is coming next. Services belong to your primary Cue profile and use your saved region.</p></section>
  </Page>;
}
