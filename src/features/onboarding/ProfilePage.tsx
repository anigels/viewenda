import { useCallback, useEffect, useState } from 'react';
import { IonButton, IonCheckbox, IonInput, IonItem, IonList, IonSearchbar } from '@ionic/react';
import { Page } from '../../components/Page';
import { RemoteFeedback } from '../../components/RemoteFeedback';
import { useViewenda } from '../../hooks/useViewenda';
import { useRemote } from '../../hooks/useRemote';
import { tmdb } from '../../services/tmdb';
function ProviderPicker({ region, selected, onChange, disabled }: { region: string; selected: number[]; onChange: (ids: number[]) => void; disabled: boolean }) {
  const [query, setQuery] = useState('');
  const loader = useCallback(() => tmdb.allProviders(region), [region]);
  const result = useRemote(loader);
  const missing = result.data ? selected.filter(id => !result.data!.some(p => p.provider_id === id)) : [];
  return <section><h2>Your streaming services · {region}</h2><p>Choose the services you use. Save your profile to keep these selections.</p><RemoteFeedback {...result} />
    {result.data && <><IonSearchbar aria-label="Filter streaming services" placeholder="Find a service" value={query} onIonInput={e => setQuery(e.detail.value ?? '')} />
      {!result.data.length && <p>No services are listed for this region.</p>}
      <IonList className="provider-list">{result.data.filter(p => p.provider_name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).map(p => <IonItem key={p.provider_id}><IonCheckbox disabled={disabled} checked={selected.includes(p.provider_id)} onIonChange={e => onChange(e.detail.checked ? [...new Set([...selected, p.provider_id])] : selected.filter(id => id !== p.provider_id))}>{p.provider_name}</IonCheckbox></IonItem>)}</IonList>
      {!!missing.length && <><p>These saved services are not listed in this region. You can keep or remove them.</p>{missing.map(id => <IonCheckbox className="unlisted-provider" disabled={disabled} key={id} checked onIonChange={() => onChange(selected.filter(value => value !== id))}>Saved service #{id}</IonCheckbox>)}</>}
    </>}
    <p>{selected.length} selected</p>
  </section>;
}
export function ProfilePage() {
  const { data, saveProfile } = useViewenda();
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data?.profile) { setName(data.profile.name); setRegion(data.profile.region); setSelected(data.profile.selectedProviderIds); } }, [data?.profile]);
  const normalizedRegion = region.trim().toUpperCase();
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!data || saving) return;
    if (!name.trim() || !/^[A-Z]{2}$/.test(normalizedRegion)) { setMessage('Enter a name and a two-letter country code, such as US.'); return; }
    setSaving(true); setMessage('');
    try { await saveProfile({ ...data.profile, name: name.trim(), region: normalizedRegion, selectedProviderIds: selected }); setMessage('Profile and services saved on this device.'); }
    catch { setMessage('Could not save. Check browser storage access and try again.'); }
    finally { setSaving(false); }
  }
  return <Page title="Services / Profile"><p className="eyebrow">MAKE VIEWENDA YOURS</p><h1>Your corner of Viewenda.</h1><p className="lede">Your services, your region. No sign-in needed.</p>
    <form onSubmit={save}><IonList inset><IonItem><IonInput label="Profile name" labelPlacement="stacked" value={name} disabled={saving || !data} maxlength={80} autocomplete="nickname" onIonInput={e => setName(e.detail.value ?? '')} required /></IonItem>
      <IonItem><IonInput label="Region code" labelPlacement="stacked" helperText="Two-letter country code for streaming availability." value={region} disabled={saving || !data} maxlength={2} autocapitalize="characters" onIonInput={e => setRegion(e.detail.value ?? '')} required /></IonItem></IonList>
      {data && /^[A-Z]{2}$/.test(normalizedRegion) && <ProviderPicker key={normalizedRegion} region={normalizedRegion} selected={selected} onChange={setSelected} disabled={saving} />}
      <IonButton type="submit" expand="block" disabled={!data || saving}>{saving ? 'Saving…' : 'Save profile'}</IonButton><p role="status" aria-live="polite">{message}</p>
    </form>
    <section className="attribution"><h2>Credits</h2><a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer"><img className="tmdb-logo" src="/tmdb-logo.svg" alt="TMDB" /></a><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p><p>Streaming availability data by <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer">JustWatch</a>.</p></section>
  </Page>;
}
