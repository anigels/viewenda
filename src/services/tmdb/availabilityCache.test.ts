import { expect, it, vi } from 'vitest';
import { createAvailabilityLookup } from './availabilityCache';
import type { ProviderAvailability, TmdbResult } from './client';
const movie = { tmdbId: 1, mediaType: 'movie' as const, title: 'Title', posterPath: null };
it('deduplicates concurrent lookups and caches by region and media type', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, data: null });
  const lookup = createAvailabilityLookup(fetcher);
  await Promise.all([lookup(movie, 'us'), lookup(movie, 'US')]);
  await lookup(movie, 'US');
  expect(fetcher).toHaveBeenCalledTimes(1);
  await lookup(movie, 'CA');
  await lookup({ ...movie, mediaType: 'tv' }, 'US');
  expect(fetcher).toHaveBeenCalledTimes(3);
});
it('retries failures and refreshes successful entries after five minutes', async () => {
  let now = 1000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  try {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: false, error: { kind: 'network', message: 'Offline' } }).mockResolvedValue({ ok: true, data: null });
    const lookup = createAvailabilityLookup(fetcher);
    await lookup(movie, 'US');
    await new Promise(resolve => setTimeout(resolve, 0));
    await lookup(movie, 'US');
    now += 300001;
    await new Promise(resolve => setTimeout(resolve, 0));
    await lookup(movie, 'US');
    expect(fetcher).toHaveBeenCalledTimes(3);
  } finally { vi.restoreAllMocks(); }
});
it('limits concurrent requests to four', async () => {
  const releases: ((value: TmdbResult<ProviderAvailability | null>) => void)[] = [];
  const fetcher = vi.fn(() => new Promise<TmdbResult<ProviderAvailability | null>>(resolve => releases.push(resolve)));
  const lookup = createAvailabilityLookup(fetcher);
  const requests = Array.from({ length: 6 }, (_, i) => lookup({ ...movie, tmdbId: i + 1 }, 'US'));
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(fetcher).toHaveBeenCalledTimes(4);
  releases.splice(0).forEach(resolve => resolve({ ok: true, data: null }));
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(fetcher).toHaveBeenCalledTimes(6);
  releases.splice(0).forEach(resolve => resolve({ ok: true, data: null }));
  await Promise.all(requests);
});
