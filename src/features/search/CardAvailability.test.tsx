// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CardAvailability } from './CardAvailability';
import { lookupAvailability } from '../../services/tmdb';
vi.mock('../../services/tmdb', () => ({ lookupAvailability: vi.fn(), posterUrl: () => undefined }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const media = { tmdbId: 1, mediaType: 'tv' as const, title: 'A show', posterPath: null };
const provider = (id: number, name: string) => ({ provider_id: id, provider_name: name, logo_path: null, display_priority: 1 });
it('shows offer types separately and highlights selected services without hiding others', async () => {
  vi.mocked(lookupAvailability).mockResolvedValue({ ok: true, data: { link: '', flatrate: [provider(1, 'Other platform'), provider(2, 'My platform')], rent: [provider(3, 'Rental shop')] } });
  const view = render(<CardAvailability media={media} region="US" selected={[2]} />);
  await screen.findByText('My platform');
  expect(screen.getByText('Subscription')).toBeTruthy();
  expect(screen.getByText('Rent')).toBeTruthy();
  expect(screen.getByText('Other platform')).toBeTruthy();
  expect(screen.getByText('Your service').closest('li')?.textContent).toContain('My platform');
  view.rerender(<CardAvailability media={media} region="CA" selected={[]} />);
  await waitFor(() => expect(lookupAvailability).toHaveBeenLastCalledWith(media, 'CA'));
  await waitFor(() => expect(screen.queryByText('Your service')).toBeNull());
});
it('does not claim unavailability when TMDB has no offers', async () => {
  vi.mocked(lookupAvailability).mockResolvedValue({ ok: true, data: null });
  render(<CardAvailability media={media} region="US" selected={[]} />);
  expect(await screen.findByText('Availability not reported.')).toBeTruthy();
});
