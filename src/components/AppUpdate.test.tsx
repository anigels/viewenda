// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AppUpdate } from './AppUpdate';
const state = vi.hoisted(() => ({ available: true, update: vi.fn() }));
vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: () => ({ needRefresh: [state.available], updateServiceWorker: state.update }) }));
afterEach(() => { cleanup(); state.available = true; state.update.mockReset(); });
it('offers updates only when available and defers without reloading', () => {
  state.available = false;
  const view = render(<AppUpdate />);
  expect(screen.queryByText('Update and reload')).toBeNull();
  state.available = true; view.rerender(<AppUpdate />);
  fireEvent.click(screen.getByText('Later'));
  expect(screen.queryByText('Update and reload')).toBeNull();
  expect(state.update).not.toHaveBeenCalled();
});
it('updates only on request and offers retry on failure', async () => {
  state.update.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  render(<AppUpdate />);
  expect(state.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Update and reload'));
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  fireEvent.click(screen.getByText('Update and reload'));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(state.update).toHaveBeenCalledTimes(2);
});
