// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BackupSettings } from './BackupSettings';
import { ViewendaProvider } from '../../app/ViewendaProvider';
import { createInitialData } from '../../data/ViewendaRepository';
import { exportBackup } from '../../data/backup';
afterEach(cleanup);

it('previews without saving and restores only after explicit confirmation', async () => {
  const data = createInitialData();
  const replacement = { ...data, profile: { ...data.profile, name: 'Imported profile' } };
  const saveAll = vi.fn().mockResolvedValue(undefined);
  render(<ViewendaProvider repository={{ load: async () => data, save: async () => {}, saveAll }}><BackupSettings /></ViewendaProvider>);
  const input = screen.getByLabelText('Choose a Viewenda backup');
  await waitFor(() => expect((input as HTMLInputElement).disabled).toBe(false));
  const file = { size: 100, text: async () => exportBackup(replacement) };
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByText(/Backup profile: Imported profile/)).toBeTruthy());
  expect(saveAll).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Cancel restore'));
  expect(screen.queryByText('Review before restoring')).toBeNull();
  expect(saveAll).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByText('Review before restoring')).toBeTruthy());
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByText('Replace data and restore'));
  await waitFor(() => expect(screen.getByText('Backup restored. Your saved data is ready.')).toBeTruthy());
  expect(saveAll).toHaveBeenCalledWith(replacement);
});
