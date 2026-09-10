import type { ViewendaData } from './ViewendaRepository';
import { LocalViewendaRepository } from './localViewendaRepository';
import { mediaId } from '../domain/models';

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export function exportBackup(data: ViewendaData) {
  const raw = JSON.stringify({ app: 'Viewenda', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
  if (new Blob([raw]).size > MAX_BACKUP_BYTES) throw new Error('Your data exceeds the 5 MB backup limit.');
  return raw;
}
export async function parseBackup(raw: string): Promise<ViewendaData> {
  try {
    if (new Blob([raw]).size > MAX_BACKUP_BYTES) throw new Error();
    const backup = JSON.parse(raw);
    if (backup.app !== 'Viewenda' || backup.version !== 1 || !backup.data) throw new Error();
    // Reuse storage validation without reading or writing the user's storage.
    const repository = new LocalViewendaRepository(() => ({
      getItem: () => JSON.stringify({ version: 1, data: backup.data }),
      setItem: () => { throw new Error('Read-only validation'); },
    }));
    const data = await repository.load();
    const unique = (ids: string[]) => new Set(ids).size === ids.length;
    if (!unique(data.watchlist.map(item => mediaId(item.media))) ||
        !unique(data.viewers.map(item => item.id)) || !unique(data.watchPlans.map(item => item.id)) ||
        !unique(data.watchNights.map(item => item.id))) throw new Error();
    return data;
  } catch {
    throw new Error('This is not a supported Viewenda backup. Choose a valid backup up to 5 MB. Your saved data has not changed.');
  }
}
export function restoreBackup(current: ViewendaData, expected: string, replacement: ViewendaData): ViewendaData {
  if (JSON.stringify(current) !== expected) throw new Error('Your saved data changed while reviewing this backup. Choose the file again to review the latest data before restoring.');
  return replacement;
}
