import { expect, it, vi } from 'vitest';
import { TmdbClient } from './client';
it('does not make a request without configuration', async () => {
  const fetcher = vi.fn();
  expect(await new TmdbClient('', fetcher).movieDetails(1)).toMatchObject({ ok: false, error: { kind: 'configuration' } });
  expect(fetcher).not.toHaveBeenCalled();
});
it('maps media types and excludes people in multi-search', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ page: 1, total_pages: 1, results: [
    { id: 1, media_type: 'movie', title: 'Movie' }, { id: 1, media_type: 'tv', name: 'Show' }, { id: 2, media_type: 'person', name: 'Person' },
  ] })));
  const result = await new TmdbClient('test-only-placeholder', fetcher).multiSearch('hello & world');
  expect(result).toMatchObject({ ok: true, data: { results: [{ mediaType: 'movie', tmdbId: 1 }, { mediaType: 'tv', tmdbId: 1 }] } });
  expect((fetcher.mock.calls[0][0] as URL).searchParams.get('query')).toBe('hello & world');
});
it('uses the supplied region for provider availability', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: { CA: { link: 'https://www.themoviedb.org/tv/1/watch?locale=CA' } } })));
  const result = await new TmdbClient('test-only-placeholder', fetcher).watchProviders({ tmdbId: 1, mediaType: 'tv' }, 'CA');
  expect(result).toEqual({ ok: true, data: { link: 'https://www.themoviedb.org/tv/1/watch?locale=CA' } });
});
it('returns safe HTTP and network failures without leaking credentials', async () => {
  const http = new TmdbClient('test-only-placeholder', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
  expect(await http.tvDetails(1)).toMatchObject({ ok: false, error: { kind: 'http', status: 401 } });
  const network = new TmdbClient('test-only-placeholder', vi.fn().mockRejectedValue(new Error('sensitive details')));
  expect(await network.tvDetails(1)).toMatchObject({ ok: false, error: { kind: 'network' } });
});

it('rejects malformed responses and unsafe external provider links', async () => {
  const badSearch = new TmdbClient('test-only', vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [null] }))));
  expect(await badSearch.multiSearch('test')).toMatchObject({ ok: false, error: { kind: 'response' } });
  const badLink = new TmdbClient('test-only', vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: { US: { link: 'javascript:alert(1)' } } }))));
  expect(await badLink.watchProviders({ tmdbId: 1, mediaType: 'movie' }, 'US')).toMatchObject({ ok: false, error: { kind: 'response' } });
});
it('combines movie and TV providers and deduplicates shared provider IDs', async () => {
  const provider = (id: number) => ({ provider_id: id, provider_name: 'Service ' + id, logo_path: null, display_priority: 1 });
  const fetcher = vi.fn().mockImplementation(async (url: URL) => new Response(JSON.stringify({ results: url.pathname.endsWith('/movie') ? [provider(1)] : [provider(1), provider(2)] })));
  expect(await new TmdbClient('test-only', fetcher).allProviders('CA')).toMatchObject({ ok: true, data: [{ provider_id: 1 }, { provider_id: 2 }] });
  expect(fetcher.mock.calls.every(([url]) => url.searchParams.get('watch_region') === 'CA')).toBe(true);
});
it('returns no availability for an absent region without inventing an offer', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: {} })));
  expect(await new TmdbClient('test-only', fetcher).watchProviders({ tmdbId: 1, mediaType: 'movie' }, 'CA')).toEqual({ ok: true, data: null });
});
it('deduplicates repeated search results while keeping movie/TV collisions separate', async () => {
  const entry = { id: 42, media_type: 'movie', title: 'Movie' };
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ page: 1, total_pages: 1, results: [entry, entry, { id: 42, media_type: 'tv', name: 'Show' }] })));
  const result = await new TmdbClient('test-only', fetcher).multiSearch('query');
  expect(result.ok && result.data.results).toHaveLength(2);
});
it('calls the browser fetch function without rebinding it to the client', async () => {
  vi.stubEnv('VITE_TMDB_BEARER_TOKEN', 'test-only');
  vi.stubGlobal('fetch', function(this: unknown) {
    expect(this).not.toBeInstanceOf(TmdbClient);
    return Promise.resolve(new Response(JSON.stringify({ page: 1, total_pages: 0, results: [] })));
  });
  try { expect(await new TmdbClient().multiSearch('query')).toMatchObject({ ok: true }); }
  finally { vi.unstubAllGlobals(); vi.unstubAllEnvs(); }
});
