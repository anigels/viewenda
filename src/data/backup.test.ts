import { expect, it } from 'vitest';
import { exportBackup, parseBackup, restoreBackup } from './backup';
import { createInitialData } from './ViewendaRepository';
import { addTitle } from '../domain/watchlist';
import { completeEpisode } from '../domain/episodes';
import { saveManualPlan } from './planningActions';
import { LocalViewendaRepository } from './localViewendaRepository';
import { ViewendaStore } from './ViewendaStore';

it('round-trips profile, episode progress and episode plans through export and storage', async () => {
  const media = { tmdbId: 4, mediaType: 'tv' as const, title: 'Saved show', posterPath: null };
  let data = createInitialData();
  data.watchlist = completeEpisode(addTitle([], media), media, { season: 2, number: 3 });
  data = saveManualPlan(data, { id: 'plan', media, episode: { season: 2, number: 4 }, date: '2026-09-10', source: 'manual' });
  const imported = await parseBackup(exportBackup(data));
  expect(imported).toEqual(data);
  let raw: string | null = null;
  const repository = new LocalViewendaRepository(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }));
  await repository.saveAll(imported);
  expect(await repository.load()).toEqual(data);
});
it('rejects malformed, future-version, duplicate and invalid episode backups', async () => {
  await expect(parseBackup('not json')).rejects.toThrow('supported');
  const backup = JSON.parse(exportBackup(createInitialData()));
  await expect(parseBackup(JSON.stringify({ ...backup, version: 2 }))).rejects.toThrow();
  backup.data.viewers = [{ id: 'a', name: 'A' }, { id: 'a', name: 'B' }];
  await expect(parseBackup(JSON.stringify(backup))).rejects.toThrow();
  backup.data.viewers = [];
  backup.data.watchPlans = [{ id: 'bad', date: '2026-02-30' }];
  await expect(parseBackup(JSON.stringify(backup))).rejects.toThrow();
});
it('refuses a stale preview and preserves existing data after a failed restore', async () => {
  const initial = createInitialData();
  const expected = JSON.stringify(initial);
  const replacement = { ...initial, profile: { ...initial.profile, name: 'Restored' } };
  expect(() => restoreBackup(replacement, expected, initial)).toThrow('changed');
  let raw = JSON.stringify({ version: 1, data: initial });
  const repository = new LocalViewendaRepository(() => ({ getItem: () => raw, setItem: () => { throw new Error('Quota'); } }));
  const store = new ViewendaStore(repository); await store.initialize();
  await expect(store.transact(current => restoreBackup(current, expected, replacement))).rejects.toThrow('Quota');
  expect(store.getSnapshot().data).toEqual(initial);
  expect(JSON.parse(raw).data).toEqual(initial);
});
