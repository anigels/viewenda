import { useRef, useState } from 'react';
import { IonButton } from '@ionic/react';
import { useViewenda } from '../../hooks/useViewenda';
import { exportBackup, MAX_BACKUP_BYTES, parseBackup, restoreBackup } from '../../data/backup';
import type { ViewendaData } from '../../data/ViewendaRepository';
import { localDate } from '../../domain/planning';

function Counts({ data }: { data: ViewendaData }) {
  return <p>{data.watchlist.length} saved titles · {data.watchPlans.length} plans · {data.viewers.length} viewers · {data.watchNights.length} watch nights</p>;
}
export function BackupSettings() {
  const { data, updatePlanning } = useViewenda();
  const [pending, setPending] = useState<{ data: ViewendaData; expected: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  function cancel() { setPending(null); setConfirmed(false); if (input.current) input.current.value = ''; }
  return <section className="planning-panel"><h2>Backup & restore</h2>
    <p>Keep a copy of your saved profile, services, watchlist, episode progress, and plans. Transfer the file to another browser or device to restore it there.</p>
    <IonButton disabled={!data || busy} onClick={() => {
      if (!data) return;
      setError(''); setMessage('');
      try {
        const url = URL.createObjectURL(new Blob([exportBackup(data)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = 'viewenda-backup-' + localDate() + '.json';
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage('Backup download started. Keep the file somewhere you can find it.');
      } catch (error) { setError(error instanceof Error ? error.message : 'Could not download the backup. Try again.'); }
    }}>Download backup</IonButton>
    <p>Backups contain your viewing history and profile names. No TMDB token is included. Only saved edits are exported.</p>
    <label className="native-field"><span>Choose a Viewenda backup</span><input ref={input} type="file" accept=".json,application/json" disabled={!data || busy} onChange={async event => {
      const file = event.target.files?.[0]; cancel(); setError(''); setMessage('');
      if (!file || !data) return;
      setBusy(true);
      try {
        if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a backup up to 5 MB.');
        const replacement = await parseBackup(await file.text());
        setPending({ data: replacement, expected: JSON.stringify(data) });
      } catch (error) { setError(error instanceof Error ? error.message : 'Could not read the backup.'); }
      finally { setBusy(false); }
    }} /></label>
    {pending && data && <div>
      <h3>Review before restoring</h3>
      <p>Currently saved on this device:</p><Counts data={data} />
      <p>Backup profile: {pending.data.profile.name} · {pending.data.profile.region}</p><Counts data={pending.data} />
      <p>Restore replaces all saved Viewenda data on this browser. Download a backup of your current data first if you want to keep it. Open form edits are not included.</p>
      <label><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} /> I understand this replaces my saved data.</label>
      <div><IonButton disabled={busy || !confirmed} onClick={async () => {
        if (busy || !confirmed) return;
        setBusy(true); setError('');
        try { await updatePlanning(current => restoreBackup(current, pending.expected, pending.data)); cancel(); setMessage('Backup restored. Your saved data is ready.'); }
        catch (error) { setError(error instanceof Error ? error.message : 'Could not restore. Your previous data is unchanged.'); }
        finally { setBusy(false); }
      }}>Replace data and restore</IonButton><IonButton fill="clear" disabled={busy} onClick={cancel}>Cancel restore</IonButton></div>
    </div>}
    {busy && <p role="status">Working…</p>}{message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
