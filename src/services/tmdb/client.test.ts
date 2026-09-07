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
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: { CA: { link: 'https://example.com/ca' } } })));
  const result = await new TmdbClient('test-only-placeholder', fetcher).watchProviders({ tmdbId: 1, mediaType: 'tv' }, 'CA');
  expect(result).toEqual({ ok: true, data: { link: 'https://example.com/ca' } });
});
it('returns safe HTTP and network failures without leaking credentials', async () => {
  const http = new TmdbClient('test-only-placeholder', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
  expect(await http.tvDetails(1)).toMatchObject({ ok: false, error: { kind: 'http', status: 401 } });
  const network = new TmdbClient('test-only-placeholder', vi.fn().mockRejectedValue(new Error('sensitive details')));
  expect(await network.tvDetails(1)).toMatchObject({ ok: false, error: { kind: 'network' } });
});
