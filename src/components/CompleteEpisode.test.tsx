// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CompleteEpisode } from './CompleteEpisode';
import { ViewendaProvider } from '../app/ViewendaProvider';
import { createInitialData } from '../data/ViewendaRepository';
import { addTitle } from '../domain/watchlist';
import { completeEpisode } from '../domain/episodes';

afterEach(cleanup);
const media = { tmdbId: 1, mediaType: 'tv' as const, title: 'Show', posterPath: null };
const episode = { season: 2, number: 3 };
it('never rewinds newer progress or changes favorites and status', () => {
  const items = completeEpisode(addTitle([], media), media, episode);
  expect(completeEpisode(items, media, { season: 1, number: 9 })).toBe(items);
  expect(completeEpisode(items, media, episode)).toBe(items);
  expect(items[0]).toMatchObject({ status: 'Want to Watch', isFavorite: false, lastCompletedEpisode: episode });
  expect(() => completeEpisode([], media, episode)).toThrow('no longer saved');
  expect(() => completeEpisode(items, media, { season: 0, number: 1 })).toThrow();
});
it('requires confirmation, retains progress on save failure and supports retry', async () => {
  const data = createInitialData(); data.watchlist = addTitle([], media);
  const save = vi.fn().mockRejectedValueOnce(new Error('quota')).mockResolvedValue(undefined);
  render(<ViewendaProvider repository={{ load: async () => data, save, saveAll: async () => {} }}><CompleteEpisode media={media} episode={episode} /></ViewendaProvider>);
  await waitFor(() => expect(screen.getByText('Mark watched')).toBeTruthy());
  fireEvent.click(screen.getByText('Mark watched'));
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Cancel'));
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Mark watched'));
  fireEvent.click(screen.getByText('Confirm watched'));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Could not save'));
  expect(screen.queryByText('Watched', { exact: true })).toBeNull();
  fireEvent.click(screen.getByText('Confirm watched'));
  await waitFor(() => expect(screen.getByText('Watched', { exact: true })).toBeTruthy());
  expect(save.mock.calls[1][1][0].lastCompletedEpisode).toEqual(episode);
});
