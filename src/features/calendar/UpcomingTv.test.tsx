// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UpcomingTv } from './UpcomingTv';
import { tmdb } from '../../services/tmdb';
import { localDate } from '../../domain/planning';
import type { TvDetails, TmdbResult } from '../../services/tmdb/client';
vi.mock('../../services/tmdb', () => ({ tmdb: { tvDetails: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const show = { tmdbId: 1, mediaType: 'tv' as const, title: 'Saved series', posterPath: null };
const today = localDate();
const result = (id: number): TmdbResult<TvDetails> => ({ ok: true, data: { id, name: 'Series', overview: '', poster_path: null, next_episode_to_air: { id: 100, air_date: today, season_number: 2, episode_number: 4 } } });
it('shows dates and partial failures separately and lets users jump weeks', async () => {
  vi.mocked(tmdb.tvDetails).mockImplementation(async id => id === 1 ? result(id) : { ok: false, error: { kind: 'network', message: 'Connection unavailable' } });
  const onShowWeek = vi.fn();
  render(<MemoryRouter><UpcomingTv media={[show, { ...show, tmdbId: 2, title: 'Other series' }]} dates={[]} onShowWeek={onShowWeek} /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText(/Could not check 1/)).toBeTruthy());
  fireEvent.click(screen.getByText('Show week', { exact: true }));
  expect(onShowWeek).toHaveBeenCalledWith(today);
  expect(screen.getByText(/Connection unavailable/)).toBeTruthy();
});
it('does not let an older watchlist request replace newer results', async () => {
  let resolveOld!: (value: TmdbResult<TvDetails>) => void;
  vi.mocked(tmdb.tvDetails).mockImplementation(id => id === 1 ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(result(id)));
  const view = render(<MemoryRouter><UpcomingTv media={[show]} dates={[today]} onShowWeek={() => {}} /></MemoryRouter>);
  view.rerender(<MemoryRouter><UpcomingTv media={[{ ...show, tmdbId: 2, title: 'New series' }]} dates={[today]} onShowWeek={() => {}} /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('heading', { name: 'New series' })).toBeTruthy());
  await act(async () => resolveOld(result(1)));
  expect(screen.queryByRole('heading', { name: 'Saved series' })).toBeNull();
  expect(screen.getByRole('heading', { name: 'New series' })).toBeTruthy();
});
